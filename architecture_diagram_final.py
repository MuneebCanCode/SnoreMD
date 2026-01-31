from diagrams import Diagram, Cluster, Edge
from diagrams.aws.compute import Lambda
from diagrams.aws.database import Dynamodb
from diagrams.aws.network import APIGateway
from diagrams.onprem.client import Users
from diagrams.programming.framework import React

# Configure diagram for maximum clarity
graph_attr = {
    "fontsize": "18",
    "bgcolor": "white",
    "pad": "2.0",
    "nodesep": "3.0",
    "ranksep": "3.0",
    "splines": "spline",
    "concentrate": "false",
}

node_attr = {
    "fontsize": "16",
    "height": "2.0",
    "width": "3.0",
    "fixedsize": "true",
}

edge_attr = {
    "fontsize": "14",
    "penwidth": "2.0",
}

with Diagram(
    "SnoreMD Patient Notes System Architecture",
    filename="snoremd_architecture_final",
    show=False,
    direction="TB",
    graph_attr=graph_attr,
    node_attr=node_attr,
    edge_attr=edge_attr,
    outformat="png",
):
    
    # Client Layer
    with Cluster("Client Layer", graph_attr={"bgcolor": "#E8F5E9", "penwidth": "2"}):
        users = Users("Clinicians")
    
    # Presentation Layer
    with Cluster("Presentation Layer", graph_attr={"bgcolor": "#E3F2FD", "penwidth": "2"}):
        frontend = React("React SPA")
    
    # API Layer
    with Cluster("API Layer", graph_attr={"bgcolor": "#FFF3E0", "penwidth": "2"}):
        api = APIGateway("API Gateway")
    
    # Application Layer
    with Cluster("Application Layer", graph_attr={"bgcolor": "#FCE4EC", "penwidth": "2"}):
        lambda_create = Lambda("Create Note")
        lambda_get = Lambda("Get Notes")
        lambda_update = Lambda("Update Note")
    
    # Data Layer
    with Cluster("Data Layer", graph_attr={"bgcolor": "#F3E5F5", "penwidth": "2"}):
        db_notes = Dynamodb("Notes Table")
        db_counter = Dynamodb("Counter Table")
    
    # Define connections with clear flow
    users >> Edge(color="blue", style="bold", label="HTTPS") >> frontend
    
    frontend >> Edge(color="blue", style="bold", label="REST API") >> api
    
    api >> Edge(color="green", style="bold", label="POST") >> lambda_create
    api >> Edge(color="orange", style="bold", label="GET") >> lambda_get
    api >> Edge(color="purple", style="bold", label="PUT") >> lambda_update
    
    lambda_create >> Edge(color="green", label="Write") >> db_notes
    lambda_create >> Edge(color="green", label="Increment") >> db_counter
    
    lambda_get >> Edge(color="orange", label="Query") >> db_notes
    
    lambda_update >> Edge(color="purple", label="Update") >> db_notes

print("Final architecture diagram generated!")
print("File: snoremd_architecture_final.png")
