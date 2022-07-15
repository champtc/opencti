node {
  checkout scm

  String registry = 'docker.darklight.ai'
  String product = 'opencti'
  String branch = "${env.BRANCH_NAME}"
  String commit = "${sh(returnStdout: true, script: 'git rev-parse HEAD')}"
  String commitMessage = "${sh(returnStdout: true, script: "git log --pretty=format:%s -n 1 ${commit}")}"
  String tag = 'latest'
  String graphql = 'https://cyio.darklight.ai/graphql'
  String api = 'api'
  String version = '0.1.0'
  String sha = ''

  echo "branch: ${branch}, commit message: ${commitMessage}"

  // Configure which endpoint to use based on the branch
  if (branch != 'master' && branch != 'prod') { // already defaulted to production
    tag = branch.replace('#', '')
    if (branch == 'staging') {
      graphql = 'https://cyio-staging.darklight.ai/graphql'
      api = 'api-staging'
    } else {
      graphql = 'https://cyio-dev.darklight.ai/graphql'
      api = 'api-dev'
    }
  }

  // Check version, yarn install, etc.
  stage('Setup') {
    dir('opencti-platform') {
      dir('opencti-graphql') { // GraphQL
        version = readJSON(file: 'package.json')['version']
        switch (branch) {
          case 'develop':
            version = "${version}-dev+" + "${commit}"[0..7]
            sh label: 'updating version', script: """
              tmp=\$(mktemp)
              jq '.version = "${version}"' package.json > \$tmp
              mv -f \$tmp package.json
            """
            break
          case 'staging':
            version = "${version}-RC+" + "${commit}"[0..7]
            sh label: 'updating version', script: """
              tmp=\$(mktemp)
              jq '.version = "${version}"' package.json > \$tmp
              mv -f \$tmp package.json
            """
            break
          default:
            break
        }

        // Send message to Teams that the build is starting
        office365ConnectorSend(
          webhookUrl: "${env.TEAMS_DOCKER_HOOK_URL}",
          message: 'Build started',
          factDefinitions: [[name: 'Commit', template: "[${commit[0..7]}](https://github.com/champtc/opencti/commit/${commit})"],
                            [name: 'Version', template: "${version}"]]
        )

        if (fileExists('config/schema/compiled.graphql')) {
          sh 'rm config/schema/compiled.graphql'
        }
        sh 'yarn install'
      }
      dir('opencti-front') { // Frontend
        // TODO: investigate
        // Hardcode the endpoints for now, should use envionment variables
        dir('src/relay') {
          sh "sed -i 's|\${hostUrl}/graphql|${graphql}|g' environmentDarkLight.js"
        }
        sh "sed -i 's|https://api-dev.|https://${api}.|g' package.json"
        sh 'yarn install'
        sh 'yarn run schema-compile'
      }
    }
  }

  // Run any tests we can that do not require a build along side the build process
  parallel build: {
      stage('Build') {
      // if core branches (master, staging, or develop) build, except if:
      //   - commit says: 'ci:skip' then skip build
      //   - commit says: 'ci:build' then build regardless of branch
      if (((branch.equals('master') || branch.equals('prod') || branch.equals('staging') || branch.equals('develop')) && !commitMessage.contains('ci:skip')) || commitMessage.contains('ci:build')) {
        dir('opencti-platform') {
          String buildArgs = '--no-cache --progress=plain .'
          sha = docker_steps(registry, product, tag, buildArgs)
        }

        // Send the Teams message to DarkLight Development > DL Builds
        office365ConnectorSend(
          status: 'Completed',
          color: '00FF00',
          webhookUrl: "${env.TEAMS_DOCKER_HOOK_URL}",
          message: "New image built and pushed!",
          factDefinitions: [[name: "Commit Message", template: "${commitMessage}"],
                            [name: "Commit", template: "[${commit[0..7]}](https://github.com/champtc/opencti/commit/${commit})"],
                            [name: "Image", template: "${registry}/${product}:${tag}"]]
        )
      } else {
        echo 'Skipping build...'
      }
    }
  }, test: {
    stage('Test') {
      if (commitMessage.contains('!ci:skip-tests')) { // TODO: Remove the !
        echo 'Skipping tests'
        currentBuild.result = 'SUCCESS'
        return
      }

      try {
        configFileProvider([
          configFile(fileId: 'graphql-env', replaceTokens: true, targetLocation: 'opencti-platform/opencti-graphql/.env')
        ]) {
          docker.image('node:16.6.0-alpine3.14').inside('-u root:root') {
            sh label: 'test front', script: '''
              cd opencti-platform/opencti-front
              yarn test || true
            '''

            sh label: 'test graphql', script: '''
              cd opencti-platform/opencti-graphql
              yarn test || true
            '''

            sh label: 'cleanup', script: '''
              chown -R 997:995 .
            '''
          }
        }
      } catch (Exception e) {
        throw e
      } finally {
        junit 'opencti-platform/opencti-graphql/test-results/jest/results.xml'
      }
    }
  }

  // Run integration tests, but do not block the ability to rapid deploy
  parallel ci: {
    stage('Integration Testing') {
      lock('docker') {
        try {
          configFileProvider([
            configFile(fileId: 'ci-testing-default-json', replaceTokens: true, targetLocation: './docker/default.json'),
            configFile(fileId: 'ci-testing-docker-env', replaceTokens: true, targetLocation: './docker/.env'),
            configFile(fileId: 'ci-testing-users-json', replaceTokens: true, targetLocation: './opencti-platform/opencti-front/cypress/fixtures/users.json')
          ]) {
            withCredentials([
              file(credentialsId: 'STARDOG_LICENSE_FILE', variable: 'LICENSE_FILE'),
              file(credentialsId: 'OPENCTI_FRONT_LOCALHOST_CRT', variable: 'CRT'),
              file(credentialsId: 'OPENCTI_FRONT_LOCALHOST_KEY', variable: 'KEY')
            ]) {
              dir('docker') {
                writeFile(file: "stardog-license-key.bin", text: readFile(LICENSE_FILE))
                writeFile(file: "opencti-front-localhost.crt", text: readFile(CRT))
                writeFile(file: "opencti-front-localhost.key", text: readFile(KEY))
                
                sh 'docker-compose --profile backend up -d && sleep 60'
                sh 'docker-compose --profile frontend up -d && sleep 30'
              }

              dir('opencti-platform/opencti-front') {
                env.CYPRESS_BASE_URL = 'https://cyio-localhost.darklight.ai:4000'
                sh """
                  \$(npm bin)/cypress install
                  \$(npm bin)/cypress verify
                  \$(npm bin)/cypress run --spec "cypress/e2e/auth.cy.js"
                """
              }
            }
          }
        } catch (Exception e) {
          throw e
        } finally {
          dir('docker') {
            echo 'Normally where I cleanup'
            // sh '''
            //   docker-compose down || true
            //   rm default.json .env || true
            // '''
          }
        }
      }
    }
  }, deploy: {
    stage('Deploy') {
      if (commitMessage.contains('ci:deploy')) {
        switch (branch) {
          case 'master':
          case 'prod':
            echo 'Deploying to production...'
            build '/deploy/OpenCTI Frontend/main'
            break
          case 'staging':
            echo 'Deploying to staging...'
            build '/deploy/OpenCTI Frontend/staging'
            break
          case 'develop':
            echo 'Deploying to develop...'
            build '/deploy/OpenCTI Frontend/dev'
            break
          default:
            echo 'Deploy flag is only supported on production, staging, or develop branches; ignoring deploy flag...'
            break
        }
      } else {
        echo 'No \'ci:deploy\' flag detected in commit message; skipping...'
      }
    }
  }

  stage('Update K8s') {
    checkout([
      $class: 'GitSCM',
      branches: [[name: '*/master']],
      extensions: [],
      userRemoteConfigs: [
        [credentialsId: 'c4b687fd-69dc-4913-b28a-45a061914f60', url: 'https://github.com/champtc/k8s']
      ]])

    dir('k8s') {
      sh 'ls -la'
      // String sha = sh(
      //   returnStdout: true,
      //   script: 'docker images --no-trunc --quiet docker.darklight.ai/opencti:develop')

      echo "Updating K8s image tag to new sha \'${sha}\'..."

      sh label: 'Kubesec Scan', script: """
        docker run -i kubesec/kubesec:512c5e0 scan /dev/stdin < /cyio/keycloak/keycloak.yaml
      """
    }
  }
}

// Generic way to build a docker image and push it to our registry
// Returns SHA of the newly created image
String docker_steps(String registry, String image, String tag, String buildArgs) {
  def app;
  String sha256 = ''

  stage('Build') {
    app = docker.build("${registry}/${image}:${tag}", "${buildArgs}")
    sha256 = sh returnStdout: true, script: "docker images --no-trunc --quiet ${registry}/${image}:${tag}"
  }

  stage('Save') {
    sh "docker save ${registry}/${image}:${tag} | gzip > ${image}.${tag}.tar.gz"
  }

  stage('Archive') {
    archiveArtifacts artifacts: "${image}.${tag}.tar.gz", fingerprint: true, followSymlinks: false
  }

  stage('Push') {
    docker.withRegistry("https://${registry}", 'docker-registry-credentials') {
      app.push("${tag}")
    }
  }

  stage('Clean') {
    sh "docker ps -a | grep Exit | cut -d ' ' -f 1 | xargs -r docker rm || true"
    sh 'docker system prune --filter "until=336h" -f'
    sh "rm ${image}.${tag}.tar.gz"
  }

  sha = sha256
  return sha256
}
