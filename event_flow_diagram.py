from diagrams import Diagram, Cluster, Edge
from diagrams.aws.compute import Lambda
from diagrams.aws.database import Dynamodb
from diagrams.aws.network import APIGateway
from diagrams.onprem.client import Users
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
    "SnoreMD Event Flow - Create Note",
    filename="event_flow_create_note",
    show=False,
    direction="LR",
    graph_attr=graph_attr,
    node_attr=node_attr,
    edge_attr=edge_attr,
):
    
    user = Users("Clinician")
    
    with Cluster("Frontend"):
        ui = React("React UI")
    
    with Cluster("API Layer"):
        api = APIGateway("API Gateway")
    
    with Cluster("Application"):
        lambda_fn = Lambda("Create Note\nHandler")
    
    with Cluster("Data Store"):
        notes_db = Dynamodb("Notes Table")
        counter_db = Dynamodb("Counter Table")
    
    # Event flow
    user >> Edge(label="1. Fill Form") >> ui
    ui >> Edge(label="2. POST /notes") >> api
    api >> Edge(label="3. Invoke") >> lambda_fn
    lambda_fn >> Edge(label="4. Increment") >> counter_db
    counter_db >> Edge(label="5. Return ID") >> lambda_fn
    lambda_fn >> Edge(label="6. Write Note") >> notes_db
    notes_db >> Edge(label="7. Confirm") >> lambda_fn
    lambda_fn >> Edge(label="8. Response") >> api
    api >> Edge(label="9. JSON") >> ui
    ui >> Edge(label="10. Display") >> user

print("Event flow diagram created: event_flow_create_note.png")
