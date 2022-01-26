const core = require("@actions/core");
const github = require("@actions/github");

async function run() {
  try {
    const orgName = "Marcato-Partners";
    const projectNumber = "4";
    // const pullRequestId = core.getInput("PR_ID");

    const myToken = "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";
    const octokit = github.getOctokit(myToken);

    const projectQuery = `
    query($org: String!, $number: Int!) {
      organization(login: $org){
        projectNext(number: $number) {
          id
          fields(first:20) {
            nodes {
              id
              name
              settings
            }
          }
          items(last: 100) {
            nodes {
              title
              id
            }
          }
        }
      }
    }`;
    const projectResult = await octokit.graphql(projectQuery, {
      org: orgName,
      number: parseInt(projectNumber),
    });

    const projectId = projectResult.organization.projectNext.id;
    const statusFieldId =
      projectResult.organization.projectNext.fields.nodes.find(
        (o) => o.name === "Status"
      ).id;
    const pullRequestedOptionId = JSON.parse(
      projectResult.organization.projectNext.fields.nodes.find(
        (o) => o.name === "Status"
      ).settings
    ).options.find((o) => o.name === "In Progress").id;
    const projectCards = projectResult.organization.projectNext.items.nodes;

    // const issuesQuery = `
    // query($pr: ID!) {
    //   node(id: $pr) {
    //     ... on PullRequest {
    //       timelineItems(itemTypes: [CONNECTED_EVENT, DISCONNECTED_EVENT], first: 100) {
    //         nodes {
    //           ... on ConnectedEvent {
    //             id
    //             subject {
    //               ... on Issue {
    //                 number
    //                 title
    //               }
    //             }
    //           }
    //           ... on DisconnectedEvent {
    //             id
    //             subject {
    //               ... on Issue {
    //                 title
    //                 number
    //               }
    //             }
    //           }
    //         }
    //       }
    //     }
    //   }
    // }`;

    // const issuesResult = await octokit.graphql(issuesQuery, {
    //   pr: pullRequestId,
    // });

    // const resource = issuesResult;
    // const issues = {};
    // resource.node.timelineItems.nodes.map((node) => {
    //   if (issues.hasOwnProperty(node.subject.number)) {
    //     issues[node.subject.number]++;
    //   } else {
    //     issues[node.subject.number] = 1;
    //   }
    // });
    // const linkedIssues = [];
    // for (const [issue, count] of Object.entries(issues)) {
    //   if (count % 2 !== 0) {
    //     linkedIssues.push(parseInt(issue));
    //   }
    // }

    // const linkedIssuesTitles = resource.node.timelineItems.nodes
    //   .filter((n) => linkedIssues.includes(n.subject.number))
    //   .map((n) => n.subject.title);

    // const projectCardIds = projectCards
    //   .filter((c) => linkedIssuesTitles.includes(c.title))
    //   .map((c) => c.id);
    // for (const projectCardId of projectCardIds) {
    //   const moveCardQuery = `
    //   mutation (
    //     $project: ID!
    //     $item: ID!
    //     $status_field: ID!
    //     $status_value: String!
    //   ) {
    //     set_status: updateProjectNextItemField(input: {
    //       projectId: $project
    //       itemId: $item
    //       fieldId: $status_field
    //       value: $status_value
    //     }) {
    //       projectNextItem {
    //         id
    //         }
    //     }
    //   }`;
    //   const issuesResult = await octokit.graphql(moveCardQuery, {
    //     project: projectId,
    //     item: projectCardId,
    //     status_field: statusFieldId,
    //     status_value: pullRequestedOptionId,
    //   });
    // }
  } catch (error) {
    core.setFailed(error.message);
  }
}
run();
