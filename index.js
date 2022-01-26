const core = require("@actions/core");
const github = require("@actions/github");

async function getAllProjectNextItems(orgName, projectNumber, octokit) {
  let query = `
    query($org: String!, $number: Int!) {
      organization(login: $org){
        projectNext(number: $number) {
          items(last: 100) {
            nodes {
              title
              id
              fieldValues(last: 30) {
                nodes {
                  value
                }
              }
              content {
                ... on Issue{
                  body
                }
              }
            }
            edges{
              cursor
            }
            totalCount
          }
        }
      }
    }`;
  const firstResult = await octokit.graphql(query, {
    org: orgName,
    number: parseInt(projectNumber),
  });
  const count = firstResult.organization.projectNext.items.totalCount;

  let allProjectNI = [firstResult.organization.projectNext.items.nodes[99]];
  let lastCursor = firstResult.organization.projectNext.items.edges[99].cursor;
  const div = Math.floor(count / 100);
  for (let i = 1; i <= div + 1; i++) {
    query = `
      query($org: String!, $number: Int!, $cursor: String!) {
        organization(login: $org){
          projectNext(number: $number) {
            items(last: 100, before: $cursor) {
              nodes {
                title
                id
                fieldValues(last: 30) {
                  nodes {
                    value
                  }
                }
                content {
                  ... on Issue{
                    body
                  }
                }
              }
              edges{
                cursor
              }
              totalCount
            }
          }
        }
      }`;
    const tempResult = await octokit.graphql(query, {
      org: orgName,
      number: parseInt(projectNumber),
      cursor: lastCursor,
    });

    lastCursor = tempResult.organization.projectNext.items.edges[0].cursor;
    allProjectNI = allProjectNI.concat(
      tempResult.organization.projectNext.items.nodes.reverse()
    );
  }
  return allProjectNI;
}

async function getLastRelease(orgName, projectNumber, octokit) {
  const query = `
  query($org: String!,  $number: Int!) {
    organization(login: $org){
      repositories(first:10) {
        nodes {
          name
          issues(states:OPEN, first:1) {
            totalCount
          }
        }
      }
      projectNext(number: $number) {
        id
        fields(first:20) {
          nodes {
            id
            name
            settings
          }
        }
      }
    }
  }`;
  const result = await octokit.graphql(query, {
    org: orgName,
    number: parseInt(projectNumber),
  });

  const releaseField = result.organization.projectNext.fields.nodes.find(
    (o) => o.name === "Release"
  );
  const lastRelease = JSON.parse(releaseField.settings).configuration
    .iterations[0];
  return lastRelease;
}

function getSortedReleaseNotes(allLastReleaseProjectNextItems) {
  const allLastReleaseIssuesBodies = allLastReleaseProjectNextItems.map(
    (pni) => pni.content.body
  );
  const releaseNotesIssues = allLastReleaseIssuesBodies.filter((body) =>
    body.toLowerCase().includes("release note")
  );

  const releaseNotes = releaseNotesIssues.map((i) => {
    const tempString = i.substring(i.toLowerCase().indexOf("release note"));
    let releaseNotesString = tempString.substring(tempString.indexOf("\n") + 1);
    let endOfParagraph = releaseNotesString.indexOf("\n");
    if (endOfParagraph !== -1) {
      while (endOfParagraph === 1) {
        releaseNotesString = releaseNotesString.substring(
          releaseNotesString.indexOf("\n")
        );
        endOfParagraph = releaseNotesString.indexOf("\n");
      }
    }
    return tempString;
  });

  console.log("*************START*************");
  for (const rn of releaseNotes) {
    console.log(rn);
    console.log("***********************************");
  }
  console.log("***************FINISH**************");
}

async function run() {
  try {
    const orgName = "Marcato-Partners";
    const projectNumber = "4";

    const myToken = core.getInput("GITHUB_TOKEN");
    const octokit = github.getOctokit(myToken);

    const lastRelease = await getLastRelease(orgName, projectNumber, octokit);
    const allProjectNextItems = await getAllProjectNextItems(
      orgName,
      projectNumber,
      octokit
    );

    const allLastReleaseProjectNextItems = allProjectNextItems.filter((pni) =>
      pni.fieldValues.nodes.map((n) => n.value).includes(lastRelease.id)
    );
    getSortedReleaseNotes(allLastReleaseProjectNextItems);
  } catch (error) {
    core.setFailed(error.message);
  }
}
run();
