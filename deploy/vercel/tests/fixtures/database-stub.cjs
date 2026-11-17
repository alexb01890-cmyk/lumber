'use strict';

const databaseStub = ({
  initialized = false,
  workspaceTableExists = initialized,
  hasWorkspaces = initialized,
  lockResults = [true],
  tableExists = true,
  readyResults = [true],
  failOnQuery,
  connectFailure,
  endFailure,
} = {}) => {
  const queries = [];
  let lockAttempt = 0;
  let readyAttempt = 0;
  let connectCount = 0;
  let endCount = 0;
  const client = {
    connect: async () => {
      connectCount++;
      if (connectFailure) throw connectFailure;
    },
    query: async (sql, values) => {
      queries.push({ sql, values });
      if (failOnQuery?.(sql)) throw new Error('database-test-failure');
      if (sql.startsWith('SELECT public.uuid_generate_v4()'))
        return {
          rows: [
            {
              uuid: 'a1d07cb9-5970-42f0-90f6-b872f06582ca',
              unaccented: 'cafe',
            },
          ],
        };
      if (sql.includes('pg_try_advisory_lock'))
        return {
          rows: [
            {
              locked:
                lockResults[Math.min(lockAttempt++, lockResults.length - 1)],
            },
          ],
        };
      if (sql.includes('information_schema.schemata'))
        return { rows: [{ initialized }] };
      if (sql.includes("to_regclass('core.workspace')"))
        return {
          rows: [
            { workspace_table: workspaceTableExists ? 'core.workspace' : null },
          ],
        };
      if (sql.includes('FROM core.workspace'))
        return { rows: [{ has_workspaces: hasWorkspaces }] };
      if (sql.includes('to_regclass'))
        return {
          rows: [
            {
              bootstrap_table: tableExists ? 'vercel_runtime.bootstrap' : null,
            },
          ],
        };
      if (sql.startsWith('SELECT 1 FROM vercel_runtime.bootstrap'))
        return {
          rows: readyResults[Math.min(readyAttempt++, readyResults.length - 1)]
            ? [{}]
            : [],
        };
      return { rows: [] };
    },
    end: async () => {
      endCount++;
      if (endFailure) throw endFailure;
    },
  };
  return {
    client,
    queries,
    connections: () => connectCount,
    ends: () => endCount,
  };
};

module.exports = { databaseStub };
