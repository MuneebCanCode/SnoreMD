from diagrams import Diagram, Cluster, Edge
from diagrams.aws.compute import Lambda
from diagrams.aws.database import Dynamodb
from diagrams.aws.network import APIGateway
from diagrams.onprem.client import Users
from diagrams.programming.framework import React

# Minimal, clean configuration
graph_attr = {
    "fontsize": "20",
    "bgcolor": "white",
    "pad": "3.0",
    "nodesep": "4.0",
    "ranksep": "4.0",
}

node_attr = {
    "fontsize": "18",
    "height": "2.5",
    "width": "3.5",
}

edge_attr = {
    "fontsize": "16",
    "penwidth": "3.0",
}

with Diagram(
    "",
    filename="snoremd_simple",
    show=False,
    direction="TB",
    graph_attr=graph_attr,
    node_attr=node_attr,
    edge_attr=edge_attr,
):
    
    users = Users("Clinicians")
    
    frontend = React("React Frontend")
    
    api = APIGateway("API Gateway")
    
    with Cluster("Lambda Functions"):
        lambdas = [
            Lambda("Create"),
            Lambda("Get"),
            Lambda("Update")
        ]
    
    with Cluster("DynamoDB Tables"):
        notes = Dynamodb("Notes")
        counter = Dynamodb("Counters")
    
    # Simple flow
    users >> frontend >> api
    api >> lambdas[0]
    api >> lambdas[1]
    api >> lambdas[2]
    
    lambdas[0] >> notes
    lambdas[0] >> counter
    lambdas[1] >> notes
    lambdas[2] >> notes

print("Simple diagram generated: snoremd_simple.png")
