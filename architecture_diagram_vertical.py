from diagrams import Diagram, Cluster, Edge
from diagrams.aws.compute import Lambda
from diagrams.aws.database import Dynamodb
from diagrams.aws.network import APIGateway
from diagrams.onprem.client import Users
from diagrams.programming.framework import React

# Configure diagram with vertical layout
graph_attr = {
    "fontsize": "16",
    "bgcolor": "white",
    "pad": "1.5",
    "nodesep": "2.0",
    "ranksep": "2.0",
    "splines": "ortho",
}

node_attr = {
    "fontsize": "14",
    "height": "1.5",
    "width": "2.5",
}

edge_attr = {
    "fontsize": "12",
}

with Diagram(
    "SnoreMD Patient Notes - High Level Architecture",
    filename="snoremd_architecture_vertical",
    show=False,
    direction="TB",  # Top to Bottom
    graph_attr=graph_attr,
    node_attr=node_attr,
    edge_attr=edge_attr,
):
    # Users at the top
    users = Users("Clinicians\n& Staff")

    # Frontend Layer
    with Cluster("Presentation Layer", graph_attr={"bgcolor": "#E3F2FD", "margin": "20"}):
        frontend = React("React SPA\n(TypeScript)")

    # API Gateway Layer
    with Cluster("API Layer", graph_attr={"bgcolor": "#FFF3E0", "margin": "20"}):
        api_gateway = APIGateway("API Gateway\n(REST API)")

    # Lambda Functions Layer
    with Cluster("Application Layer", graph_attr={"bgcolor": "#FFECB3", "margin": "20"}):
        create_lambda = Lambda("Create Note\nHandler")
        get_lambda = Lambda("Get Notes\nHandler")
        update_lambda = Lambda("Update Note\nHandler")

    # Database Layer
    with Cluster("Data Layer", graph_attr={"bgcolor": "#E8F5E9", "margin": "20"}):
        notes_table = Dynamodb("PatientFollowupNotes\nTable")
        counter_table = Dynamodb("SleepStudyCounters\nTable")

    # Define connections
    users >> Edge(label="HTTPS", color="blue") >> frontend
    frontend >> Edge(label="REST API\nCalls", color="blue") >> api_gateway
    
    api_gateway >> Edge(label="POST", color="green") >> create_lambda
    api_gateway >> Edge(label="GET", color="orange") >> get_lambda
    api_gateway >> Edge(label="PUT", color="purple") >> update_lambda
    
    create_lambda >> Edge(label="Write Note", color="green") >> notes_table
    create_lambda >> Edge(label="Atomic\nIncrement", color="green") >> counter_table
    
    get_lambda >> Edge(label="Query", color="orange") >> notes_table
    
    update_lambda >> Edge(label="Update", color="purple") >> notes_table

print("Vertical architecture diagram generated successfully!")
print("Output file: snoremd_architecture_vertical.png")
