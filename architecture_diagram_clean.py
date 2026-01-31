from diagrams import Diagram, Cluster, Edge
from diagrams.aws.compute import Lambda
from diagrams.aws.database import Dynamodb
from diagrams.aws.network import APIGateway
from diagrams.onprem.client import Users
from diagrams.programming.framework import React

# Configure diagram with better spacing
graph_attr = {
    "fontsize": "16",
    "bgcolor": "white",
    "pad": "1.0",
    "nodesep": "1.5",
    "ranksep": "1.5",
    "splines": "ortho",
}

node_attr = {
    "fontsize": "14",
    "height": "1.5",
    "width": "2.0",
}

edge_attr = {
    "fontsize": "12",
}

with Diagram(
    "SnoreMD Patient Notes System",
    filename="snoremd_architecture_clean",
    show=False,
    direction="LR",
    graph_attr=graph_attr,
    node_attr=node_attr,
    edge_attr=edge_attr,
):
    # Users
    users = Users("Clinicians")

    # Frontend Cluster
    with Cluster("Frontend\n(React App)", graph_attr={"bgcolor": "#E3F2FD"}):
        frontend = React("React\nSPA")

    # Backend Cluster
    with Cluster("Backend\n(AWS Serverless)", graph_attr={"bgcolor": "#FFF3E0"}):
        api_gateway = APIGateway("API\nGateway")
        
        with Cluster("Lambda Functions", graph_attr={"bgcolor": "#FFECB3"}):
            create_lambda = Lambda("Create\nNote")
            get_lambda = Lambda("Get\nNotes")
            update_lambda = Lambda("Update\nNote")

    # Database Cluster
    with Cluster("Data Layer", graph_attr={"bgcolor": "#E8F5E9"}):
        notes_table = Dynamodb("Notes\nTable")
        counter_table = Dynamodb("Counter\nTable")

    # Define connections with labels
    users >> Edge(label="HTTPS") >> frontend
    frontend >> Edge(label="REST API") >> api_gateway
    
    api_gateway >> Edge(label="POST /notes") >> create_lambda
    api_gateway >> Edge(label="GET /notes") >> get_lambda
    api_gateway >> Edge(label="PUT /notes") >> update_lambda
    
    create_lambda >> Edge(label="Write") >> notes_table
    create_lambda >> Edge(label="Increment") >> counter_table
    
    get_lambda >> Edge(label="Query") >> notes_table
    
    update_lambda >> Edge(label="Update") >> notes_table

print("Architecture diagram generated successfully!")
print("Output file: snoremd_architecture_clean.png")
