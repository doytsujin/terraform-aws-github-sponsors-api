# Copyright (c) 2020 Martin Donath <martin.donath@squidfunk.com>

# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to
# deal in the Software without restriction, including without limitation the
# rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
# sell copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:

# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.

# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
# FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
# IN THE SOFTWARE.

# -----------------------------------------------------------------------------
# Provider
# -----------------------------------------------------------------------------

provider aws {
  version = ">= 3.0.0, < 4.0.0"
  region  = var.region
}

# -----------------------------------------------------------------------------
# Data: IAM
# -----------------------------------------------------------------------------

# data.template_file.lambda_iam_policy.rendered
data template_file lambda_iam_policy {
  template = file("${path.module}/iam/policies/lambda.json")
}

# data.template_file.api_schema.rendered
data template_file api_schema {
  template = file("${path.module}/schema/openapi.yml")

  vars = {
    allow_headers = "Content-Type,X-Amz-Date"
    allow_methods = "GET"
    allow_origin  = var.origin

    api_name            = var.prefix
    api_integration_uri = "arn:aws:apigateway:${
      var.region
    }:lambda:path/2015-03-31/functions/${
      aws_lambda_function._.arn
    }/invocations"
  }
}

# -----------------------------------------------------------------------------
# Data: Lambda
# -----------------------------------------------------------------------------

# data.archive_file.lambda.output_path
data archive_file lambda {
  type        = "zip"
  source_dir  = "${path.module}/lambda/dist"
  output_path = "${path.module}/lambda.zip"
}

# -----------------------------------------------------------------------------
# Resources: IAM
# -----------------------------------------------------------------------------

# aws_iam_role.lambda
resource aws_iam_role lambda {
  name = "${var.prefix}-lambda"

  assume_role_policy = file(
    "${path.module}/iam/policies/assume-role/lambda.json"
  )
}

# aws_iam_policy.lambda
resource aws_iam_policy lambda {
  name = "${var.prefix}-lambda"

  policy = data.template_file.lambda_iam_policy.rendered
}

# aws_iam_policy_attachment.lambda
resource aws_iam_policy_attachment lambda {
  name = "${var.prefix}-lambda"

  policy_arn = aws_iam_policy.lambda.arn
  roles      = [aws_iam_role.lambda.name]
}

# -----------------------------------------------------------------------------
# Resources: Cloudwatch
# -----------------------------------------------------------------------------

# aws_cloudwatch_log_group._
resource aws_cloudwatch_log_group _ {
  name              = "/aws/lambda/${var.prefix}"
  retention_in_days = 14
}

# -----------------------------------------------------------------------------
# Resources: Lambda
# -----------------------------------------------------------------------------

# aws_lambda_function._
resource aws_lambda_function _ {
  function_name = var.prefix
  role          = aws_iam_role.lambda.arn
  runtime       = "nodejs12.x"
  filename      = data.archive_file.lambda.output_path
  handler       = "index.handler"
  timeout       = 30
  memory_size   = 512

  source_code_hash = data.archive_file.lambda.output_base64sha256

  environment {
    variables = {
      GITHUB_TOKEN = var.github_token
    }
  }

  depends_on = [aws_cloudwatch_log_group._]
}

# aws_lambda_permission._
resource aws_lambda_permission _ {
  principal     = "apigateway.amazonaws.com"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function._.arn
  source_arn    = "${aws_api_gateway_rest_api._.execution_arn}/*/*/*"
}

# -----------------------------------------------------------------------------
# Resources: API Gateway
# -----------------------------------------------------------------------------

# aws_api_gateway_rest_api._
resource aws_api_gateway_rest_api _ {
	name = var.prefix
  body = data.template_file.api_schema.rendered

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

# aws_api_gateway_deployment._
resource aws_api_gateway_deployment _ {
  rest_api_id = aws_api_gateway_rest_api._.id
  stage_name  = "intermediate"

  # Hack: force deployment on source code hash change
  variables = {
    "schema" = sha256(filebase64("${path.module}/schema/openapi.yml"))
    "lambda" = sha256(filebase64("${path.module}/lambda.zip"))
  }

  lifecycle {
    create_before_destroy = true
  }
}

# aws_api_gateway_stage._
resource aws_api_gateway_stage _ {
  stage_name    = "_"
  rest_api_id   = aws_api_gateway_rest_api._.id
  deployment_id = aws_api_gateway_deployment._.id
}
