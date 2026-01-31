from diagrams import Diagram, Cluster, Edge
from diagrams.onprem.vcs import Github
from diagrams.onprem.ci import GithubActions
from diagrams.aws.devtools import Codebuild
from diagrams.aws.management import Cloudformation
from diagrams.aws.compute import Lambda
from diagrams.aws.storage import S3
from diagrams.programming.framework import React

graph_attr = {
    "fontsize": "18",
    "bgcolor": "white",
    "pad": "2.0",
    "nodesep": "2.5",
    "ranksep": "2.5",
}

node_attr = {
    "fontsize": "16",
    "height": "1.8",
    "width": "2.8",
}

edge_attr = {
    "fontsize": "14",
    "penwidth": "2.0",
}

with Diagram(
    "SnoreMD CI/CD Pipeline",
    filename="cicd_pipeline",
    show=False,
    direction="LR",
    graph_attr=graph_attr,
    node_attr=node_attr,
    edge_attr=edge_attr,
):
    
    with Cluster("Source Control"):
        github = Github("GitHub\nRepository")
    
    with Cluster("Build & Test"):
        actions = GithubActions("GitHub\nActions")
        build = Codebuild("Build\nProcess")
    
    with Cluster("Infrastructure"):
        cdk = Cloudformation("AWS CDK\nDeploy")
    
    with Cluster("Backend Deployment"):
        lambda_deploy = Lambda("Lambda\nFunctions")
    
    with Cluster("Frontend Deployment"):
        s3 = S3("S3 Bucket")
        frontend = React("React App")
    
    # Pipeline flow
    github >> Edge(label="1. Push Code") >> actions
    actions >> Edge(label="2. Run Tests") >> build
    build >> Edge(label="3. Build Pass") >> cdk
    cdk >> Edge(label="4. Deploy\nBackend") >> lambda_deploy
    cdk >> Edge(label="5. Deploy\nFrontend") >> s3
    s3 >> Edge(label="6. Host") >> frontend

print("CI/CD pipeline diagram created: cicd_pipeline.png")
