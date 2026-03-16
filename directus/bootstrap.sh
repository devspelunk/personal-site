#!/bin/sh

set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
SCHEMA_PATH="$SCRIPT_DIR/schema.yaml"
REVALIDATION_FLOW_PATH="$SCRIPT_DIR/flows/revalidation-flow.json"
CONTENT_HASH_FLOW_PATH="$SCRIPT_DIR/flows/content-hash-flow.json"

DIRECTUS_URL="${DIRECTUS_INTERNAL_URL:-http://directus:8055}"
DIRECTUS_URL="${DIRECTUS_URL%/}"

CONTENT_COLLECTIONS="blog_posts,tags,blog_posts_tags,social_publish_logs,projects,projects_tags,campaigns,ttrpg_journals,ttrpg_characters,ttrpg_lore,ttrpg_homebrew,career_entries,testimonials,tech_stack_items,site_settings,directus_files"

echo "Applying Directus schema from $SCHEMA_PATH..."
npx directus schema apply "$SCHEMA_PATH" --yes

if [ -z "${DIRECTUS_ADMIN_EMAIL:-}" ] || [ -z "${DIRECTUS_ADMIN_PASSWORD:-}" ]; then
  echo "DIRECTUS_ADMIN_EMAIL and DIRECTUS_ADMIN_PASSWORD are required for API bootstrap steps."
  echo "Schema was applied, but singleton/token/flow setup was skipped."
  exit 0
fi

echo "Waiting for Directus API at $DIRECTUS_URL..."
i=0
until [ "$i" -ge 60 ]
do
  if wget -qO- "$DIRECTUS_URL/server/health" >/dev/null 2>&1; then
    break
  fi
  i=$((i + 1))
  sleep 2
done

if [ "$i" -ge 60 ]; then
  echo "Directus API did not become ready in time."
  exit 1
fi

ACCESS_TOKEN="$(
  DIRECTUS_URL="$DIRECTUS_URL" \
  DIRECTUS_ADMIN_EMAIL="$DIRECTUS_ADMIN_EMAIL" \
  DIRECTUS_ADMIN_PASSWORD="$DIRECTUS_ADMIN_PASSWORD" \
  node -e '
    (async () => {
      const response = await fetch(`${process.env.DIRECTUS_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: process.env.DIRECTUS_ADMIN_EMAIL,
          password: process.env.DIRECTUS_ADMIN_PASSWORD
        })
      });

      const json = await response.json();

      if (!response.ok || !json?.data?.access_token) {
        process.stderr.write(`Directus login failed: ${JSON.stringify(json)}\n`);
        process.exit(1);
      }

      process.stdout.write(json.data.access_token);
    })().catch((error) => {
      process.stderr.write(`${error}\n`);
      process.exit(1);
    });
  '
)"

api_request() {
  API_METHOD="$1" \
  API_URL="$DIRECTUS_URL$2" \
  API_TOKEN="${ACCESS_TOKEN:-}" \
  API_BODY="${3:-}" \
  node -e '
    (async () => {
      const method = process.env.API_METHOD;
      const url = process.env.API_URL;
      const token = process.env.API_TOKEN;
      const body = process.env.API_BODY;

      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      if (body) headers["Content-Type"] = "application/json";

      const response = await fetch(url, {
        method,
        headers,
        body: body || undefined
      });

      const text = await response.text();
      if (!response.ok) {
        process.stderr.write(`Request failed (${response.status}) ${method} ${url}\n${text}\n`);
        process.exit(1);
      }

      process.stdout.write(text);
    })().catch((error) => {
      process.stderr.write(`${error}\n`);
      process.exit(1);
    });
  '
}

api_get() {
  api_request "GET" "$1"
}

api_post() {
  api_request "POST" "$1" "$2"
}

api_patch() {
  api_request "PATCH" "$1" "$2"
}

echo "Configuring site_settings as singleton..."
api_patch "/collections/site_settings" '{"meta":{"singleton":true}}' >/dev/null

echo "Ensuring read-only role exists..."
ROLE_ID="$(api_get "/roles?filter[name][_eq]=Content%20ReadOnly&limit=1" \
  | node -e 'const fs=require("fs");const j=JSON.parse(fs.readFileSync(0,"utf8"));process.stdout.write(j?.data?.[0]?.id||"")')"

if [ -z "$ROLE_ID" ]; then
  ROLE_ID="$(api_post "/roles" '{"name":"Content ReadOnly","icon":"visibility","description":"Read-only role for Next.js content delivery","admin_access":false,"app_access":false}' \
    | node -e 'const fs=require("fs");const j=JSON.parse(fs.readFileSync(0,"utf8"));process.stdout.write(j?.data?.id||"")')"
fi

echo "Ensuring read permissions exist..."
OLD_IFS="$IFS"
IFS=","
for collection in $CONTENT_COLLECTIONS; do
  PERMISSION_ID="$(api_get "/permissions?filter[role][_eq]=$ROLE_ID&filter[collection][_eq]=$collection&filter[action][_eq]=read&limit=1" \
    | node -e 'const fs=require("fs");const j=JSON.parse(fs.readFileSync(0,"utf8"));process.stdout.write(String(j?.data?.[0]?.id||""))')"

  if [ -z "$PERMISSION_ID" ]; then
    api_post "/permissions" "{\"role\":\"$ROLE_ID\",\"collection\":\"$collection\",\"action\":\"read\",\"permissions\":{},\"validation\":{},\"presets\":{},\"fields\":[\"*\"]}" >/dev/null
  fi
done
IFS="$OLD_IFS"

echo "Ensuring service account and static token..."
SERVICE_EMAIL="nextjs-content-reader@local"
SERVICE_EMAIL_ENCODED="nextjs-content-reader%40local"
SERVICE_USER_ID="$(api_get "/users?filter[email][_eq]=$SERVICE_EMAIL_ENCODED&limit=1" \
  | node -e 'const fs=require("fs");const j=JSON.parse(fs.readFileSync(0,"utf8"));process.stdout.write(j?.data?.[0]?.id||"")')"

if [ -z "$SERVICE_USER_ID" ]; then
  SERVICE_USER_ID="$(api_post "/users" "{\"first_name\":\"Next.js\",\"last_name\":\"Content Reader\",\"email\":\"$SERVICE_EMAIL\",\"role\":\"$ROLE_ID\",\"status\":\"active\",\"password\":\"$(date +%s)-reader\"}" \
    | node -e 'const fs=require("fs");const j=JSON.parse(fs.readFileSync(0,"utf8"));process.stdout.write(j?.data?.id||"")')"
fi

if [ -n "${DIRECTUS_TOKEN:-}" ]; then
  api_patch "/users/$SERVICE_USER_ID" "{\"token\":\"$DIRECTUS_TOKEN\",\"role\":\"$ROLE_ID\"}" >/dev/null
fi

echo "Ensuring automation flows are up to date..."
DIRECTUS_URL="$DIRECTUS_URL" \
ACCESS_TOKEN="$ACCESS_TOKEN" \
REVALIDATION_FLOW_PATH="$REVALIDATION_FLOW_PATH" \
CONTENT_HASH_FLOW_PATH="$CONTENT_HASH_FLOW_PATH" \
node -e '
  const fs = require("fs");

  const baseUrl = process.env.DIRECTUS_URL;
  const token = process.env.ACCESS_TOKEN;
  const flowPaths = [process.env.REVALIDATION_FLOW_PATH, process.env.CONTENT_HASH_FLOW_PATH].filter(Boolean);

  const request = async (method, path, body) => {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { "Content-Type": "application/json" } : {})
      },
      body: body ? JSON.stringify(body) : undefined
    });

    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Request failed (${response.status}) ${method} ${path}\n${text}`);
    }

    if (!text) return null;
    const json = JSON.parse(text);
    return json?.data ?? null;
  };

  const getFlowByName = async (name) => {
    const encoded = encodeURIComponent(name);
    const flows = await request("GET", `/flows?filter[name][_eq]=${encoded}&limit=1`);
    return flows?.[0] ?? null;
  };

  const listFlowOperations = async (flowId) => {
    const operations = await request("GET", `/operations?filter[flow][_eq]=${flowId}&limit=200`);
    return Array.isArray(operations) ? operations : [];
  };

  const deleteFlowOperations = async (flowId) => {
    const operations = await listFlowOperations(flowId);
    for (const operation of operations ?? []) {
      await request("DELETE", `/operations/${operation.id}`);
    }
  };

  const createFlowOperationsFromDefinition = async (flowId, operations) => {
    const opIdByKey = {};

    for (let i = 0; i < operations.length; i += 1) {
      const operation = operations[i];
      const { resolve, reject, ...rest } = operation;
      const payload = {
        ...rest,
        flow: flowId,
        trigger: i === 0 ? "operation" : rest.trigger ?? null,
        resolve: null,
        reject: null
      };

      const created = await request("POST", "/operations", payload);
      opIdByKey[operation.key] = created.id;
    }

    for (const operation of operations) {
      if (!operation.key || !opIdByKey[operation.key]) continue;
      await request("PATCH", `/operations/${opIdByKey[operation.key]}`, {
        resolve: operation.resolve ? opIdByKey[operation.resolve] ?? null : null,
        reject: operation.reject ? opIdByKey[operation.reject] ?? null : null
      });
    }
  };

  const restoreFlowOperations = async (flowId, snapshotOperations) => {
    const restoredIdByOriginalId = {};

    for (const operation of snapshotOperations) {
      const payload = {
        name: operation.name,
        key: operation.key,
        type: operation.type,
        position_x: operation.position_x,
        position_y: operation.position_y,
        options: operation.options ?? null,
        trigger: operation.trigger ?? null,
        flow: flowId,
        resolve: null,
        reject: null
      };

      const created = await request("POST", "/operations", payload);
      restoredIdByOriginalId[operation.id] = created.id;
    }

    for (const operation of snapshotOperations) {
      const restoredId = restoredIdByOriginalId[operation.id];
      if (!restoredId) continue;

      await request("PATCH", `/operations/${restoredId}`, {
        resolve: operation.resolve ? restoredIdByOriginalId[operation.resolve] ?? null : null,
        reject: operation.reject ? restoredIdByOriginalId[operation.reject] ?? null : null
      });
    }
  };

  const upsertFlowFromFile = async (flowPath) => {
    const definition = JSON.parse(fs.readFileSync(flowPath, "utf8"));
    const flowPayload = definition.flow;
    const operations = Array.isArray(definition.operations) ? definition.operations : [];

    if (!flowPayload?.name) {
      throw new Error(`Flow definition at ${flowPath} is missing flow.name`);
    }

    let flow = await getFlowByName(flowPayload.name);
    if (flow) {
      flow = await request("PATCH", `/flows/${flow.id}`, flowPayload);
      console.log(`Updated flow: ${flowPayload.name}`);
    } else {
      flow = await request("POST", "/flows", flowPayload);
      console.log(`Created flow: ${flowPayload.name}`);
    }

    const existingOperationsSnapshot = await listFlowOperations(flow.id);

    try {
      await deleteFlowOperations(flow.id);
      await createFlowOperationsFromDefinition(flow.id, operations);
    } catch (replaceError) {
      process.stderr.write(
        `Replacing operations failed for flow "${flowPayload.name}". Attempting restore from snapshot.\n`
      );

      try {
        await deleteFlowOperations(flow.id);
        await restoreFlowOperations(flow.id, existingOperationsSnapshot);
      } catch (restoreError) {
        throw new Error(
          `Flow operation replace failed and restore failed for "${flowPayload.name}". ` +
            `Replace error: ${String(replaceError)} | Restore error: ${String(restoreError)}`
        );
      }

      throw replaceError;
    }
  };

  (async () => {
    for (const flowPath of flowPaths) {
      await upsertFlowFromFile(flowPath);
    }
  })().catch((error) => {
    process.stderr.write(`${error}\n`);
    process.exit(1);
  });
'

echo "Directus bootstrap completed."
