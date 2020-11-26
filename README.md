# Terraform GitHub Sponsors API

A Terraform module to deploy an AWS API Gateway + AWS Lambda powered API to
retrieve the sponsors for a specific GitHub account in JSON format, in order to
render something like this (click on the link to see it in action):

  [![Screenshot][1]][2]

  [1]: .github/assets/screenshot.png
  [2]: https://squidfunk.github.io/mkdocs-material/insiders/#how-sponsorship-works

## Usage

``` hcl
module "sponsors" {
  source = "github.com/squidfunk/terraform-github-sponsors-api"
  prefix = "<prefix>"
  region = "<region>"

  github_token    = "<github_token>"
  origin          = "<origin>"
}
```

This will create a regional AWS API Gateway REST API which will query GitHub's
GraphQL API for sponsorships, and return them as JSON. See the [TypeScript
typings][3] to learn about the returned format.

  [3]: https://github.com/squidfunk/terraform-github-sponsors-api/blob/master/lambda/src/sponsors/index.ts

## Configuration

### Variables

The following variables must be configured:

#### `prefix`

- __Description__: AWS resource prefix (lowercase alphanumeric)
- __Example__: `"sponsors-api"`

#### `region`

- __Description__: AWS region
- __Example__: `"us-east-1"`

#### `github_token`

- __Description__: GitHub token with scope `read:user`
- __Example__: `"0123456789abcdef0123456789abcdef01234567"`

#### `origin`

- __Description__: Allowed origins for CORS request, comma separated
- __Example__: `"https://squidfunk.github.io,https://localhost:8000"`

### Outputs

The following outputs are available:

#### `api_id`

- __Description__: API Gateway REST API identifier
- __Value__: `aws_api_gateway_rest_api._.id`

#### `api_stage_name`

- __Description__: API Gateway REST API stage name
- __Value__: `aws_api_gateway_stage._.stage_name`

#### `api_invoke_url`

- __Description__: API Gateway REST API invoke URL
- __Value__: `aws_api_gateway_stage._.invoke_url`

## License

**MIT License**

Copyright (c) 2020 Martin Donath

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to
deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
IN THE SOFTWARE.
