import submitOperation from '../../config';

const riskRemediationsQuery = `query RiskUI_remediations {
    risk(id: "79191464-5c3c-54ac-a17d-cb322f8babd6") {
      id
      created
      modified
      remediations {
        id
        name                # Title
        description         # Description
        created             # Created
        modified            # Last Modified
        response_type       # Response Type
        lifecycle           # Lifecycle
        origins{            # source of detection
          id
          origin_actors {
            actor_type
            actor_ref {
              ... on AssessmentPlatform {
                id
                name          # Source
              }
              ... on Component {
                id
                component_type
                name
              }
              ... on OscalParty {
              id
              party_type
              name            # Source
              }
            }
          }
        }
        tasks {             # only necessary if Start/End date is supported in UI
          __typename
          id
          entity_type
          task_type
          name
          description
          timing {
            ... on DateRangeTiming {
              start_date
              end_date
            }
          }
          task_dependencies {
            __typename
            id
            entity_type
            task_type
            name
          }
          associated_activities {
            __typename
            id
            entity_type
            activity_id {
              __typename
              id
              entity_type
              name
              description
              methods
            }
          }
          subjects {
            __typename
            id
            entity_type
            subject_type
            include_all
            include_subjects {
              id
              subject_type
              subject_context
              subject_ref {
                ... on Component {
                  id
                  entity_type
                  name
                }
                ... on InventoryItem {
                  id
                  entity_type
                  name
                }
                ... on OscalLocation {
                  id
                  entity_type
                  name
                }
                ... on OscalParty {
                  id
                  entity_type
                  name
                }
                ... on OscalUser {
                  id
                  entity_type
                  name
                }
              }
            }
            exclude_subjects {
              id
              subject_type
              subject_context
              subject_ref {
                ... on Component {
                  id
                  entity_type
                  name
                }
                ... on InventoryItem {
                  id
                  entity_type
                  name
                }
                ... on OscalLocation {
                  id
                  entity_type
                  name
                }
                ... on OscalParty {
                  id
                  entity_type
                  name
                }
                ... on OscalUser {
                  id
                  entity_type
                  name
                }
              }
            }
          }
          responsible_roles {
            __typename
            id
            entity_type
            role {
              __typename
              id
              entity_type
              role_identifier
              name
            }
            parties {
              __typename
              id
              entity_type
              party_type
              name
            }
          }
        }
      }
    }
  }`;

describe('Risks Remediations Tests', () => {
  it('Return risk remediations', async () => {
    const result = await submitOperation(riskRemediationsQuery);
    expect(typeof { value: result.data }).toBe('object');
  });
});