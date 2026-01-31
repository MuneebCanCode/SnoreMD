from diagrams import Diagram, Cluster, Edge
from diagrams.aws.database import Dynamodb
from diagrams.generic.database import SQL

graph_attr = {
    "fontsize": "20",
    "bgcolor": "#1a1a2e",
    "pad": "2.0",
    "nodesep": "3.0",
    "ranksep": "3.0",
    "fontcolor": "white",
}

node_attr = {
    "fontsize": "14",
    "fontcolor": "white",
    "height": "3.0",
    "width": "4.0",
    "shape": "box",
    "style": "filled",
    "fillcolor": "#16213e",
    "color": "#0f3460",
}

edge_attr = {
    "fontsize": "12",
    "fontcolor": "white",
    "color": "#e94560",
    "penwidth": "2.0",
}

with Diagram(
    "Data Model - Entity Relationship",
    filename="data_model_er",
    show=False,
    direction="LR",
    graph_attr=graph_attr,
    node_attr=node_attr,
    edge_attr=edge_attr,
):
    
    # Main tables with attributes
    with Cluster("PatientFollowupNotes", graph_attr={"bgcolor": "#0f3460", "fontcolor": "white"}):
        notes = SQL("""
PK: patientId (string)
SK: noteId (string)
---
noteText (string)
sleepStudyId (string)
createdBy (string)
createdAt (datetime)
clinicId (string)
        """)
    
    with Cluster("SleepStudyCounters", graph_attr={"bgcolor": "#0f3460", "fontcolor": "white"}):
        counters = SQL("""
PK: patientId (string)
---
counter (number)
        """)
    
    # Indexes
    with Cluster("Global Secondary Indexes", graph_attr={"bgcolor": "#533483", "fontcolor": "white"}):
        gsi1 = SQL("CreatedAtIndex\nPK: patientId\nSK: createdAt")
        gsi2 = SQL("ClinicIndex\nPK: clinicId\nSK: createdAt")
        gsi3 = SQL("ClinicianIndex\nPK: createdBy\nSK: createdAt")
    
    # Relationships
    counters >> Edge(label="generates", style="bold", color="#00d4ff") >> notes
    notes >> Edge(label="indexed by", style="dashed", color="#ffd700") >> gsi1
    notes >> Edge(label="indexed by", style="dashed", color="#ffd700") >> gsi2
    notes >> Edge(label="indexed by", style="dashed", color="#ffd700") >> gsi3

print("Data model ER diagram created: data_model_er.png")
