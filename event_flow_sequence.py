from diagrams import Diagram, Cluster, Edge
from diagrams.aws.compute import Lambda
from diagrams.aws.database import Dynamodb
from diagrams.aws.network import APIGateway
from diagrams.onprem.client import Users
from diagrams.programming.framework import React
from diagrams.generic.blank import Blank

graph_attr = {
    "fontsize": "20",
    "bgcolor": "#1a1a2e",
    "pad": "2.0",
    "nodesep": "1.0",
    "ranksep": "4.0",
    "splines": "ortho",
    "fontcolor": "white",
}

node_attr = {
    "fontsize": "16",
    "fontcolor": "white",
    "height": "1.2",
    "width": "2.5",
    "style": "filled",
    "fillcolor": "#16213e",
    "color": "#0f3460",
}

edge_attr = {
    "fontsize": "13",
    "fontcolor": "white",
    "color": "#e94560",
    "penwidth": "2.0",
}

with Diagram(
    "Event Flow - Create Patient Note",
    filename="event_flow_sequence",
    show=False,
    direction="TB",
    graph_attr=graph_attr,
    node_attr=node_attr,
    edge_attr=edge_attr,
):
    
    # Actors/Systems as columns
    clinician = Users("Clinician")
    react_ui = React("React UI")
    api_gw = APIGateway("API Gateway")
    lambda_fn = Lambda("Create Handler")
    counter_db = Dynamodb("Counter Table")
    notes_db = Dynamodb("Notes Table")
    
    # Sequence flow
    clinician >> Edge(label="1. Enter note data", style="solid") >> react_ui
    react_ui >> Edge(label="2. POST /patients/{id}/notes", style="solid") >> api_gw
    api_gw >> Edge(label="3. Invoke Lambda", style="solid") >> lambda_fn
    lambda_fn >> Edge(label="4. Atomic increment", style="solid") >> counter_db
    counter_db >> Edge(label="5. Return sequence (e.g., 3)", style="dashed") >> lambda_fn
    lambda_fn >> Edge(label="6. Generate Sleep Study ID\n(P0001-S003)", style="solid") >> lambda_fn
    lambda_fn >> Edge(label="7. Write note with ID", style="solid") >> notes_db
    notes_db >> Edge(label="8. Confirm write", style="dashed") >> lambda_fn
    lambda_fn >> Edge(label="9. Return created note", style="dashed") >> api_gw
    api_gw >> Edge(label="10. JSON response", style="dashed") >> react_ui
    react_ui >> Edge(label="11. Display success", style="dashed") >> clinician

print("Event flow sequence diagram created: event_flow_sequence.png")
