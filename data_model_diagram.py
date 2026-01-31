from diagrams import Diagram, Cluster, Edge
from diagrams.aws.database import Dynamodb
from diagrams.onprem.database import Postgresql

graph_attr = {
    "fontsize": "18",
    "bgcolor": "white",
    "pad": "2.0",
    "nodesep": "3.0",
    "ranksep": "3.0",
}

node_attr = {
    "fontsize": "16",
    "height": "2.5",
    "width": "3.5",
}

edge_attr = {
    "fontsize": "14",
    "penwidth": "2.0",
}

with Diagram(
    "SnoreMD Data Model",
    filename="data_model",
    show=False,
    direction="TB",
    graph_attr=graph_attr,
    node_attr=node_attr,
    edge_attr=edge_attr,
):
    
    with Cluster("PatientFollowupNotes Table"):
        notes = Dynamodb("PK: patientId\nSK: noteId\n---\nnoteText\nsleepStudyId\ncreatedBy\ncreatedAt\nclinicId")
    
    with Cluster("SleepStudyCounters Table"):
        counters = Dynamodb("PK: patientId\n---\ncounter")
    
    with Cluster("Indexes"):
        idx1 = Postgresql("CreatedAtIndex\nGSI")
        idx2 = Postgresql("ClinicIndex\nGSI")
        idx3 = Postgresql("ClinicianIndex\nGSI")
    
    notes >> Edge(label="Query by\npatientId + createdAt", style="dashed") >> idx1
    notes >> Edge(label="Query by\nclinicId", style="dashed") >> idx2
    notes >> Edge(label="Query by\ncreatedBy", style="dashed") >> idx3
    
    counters >> Edge(label="Atomic\nIncrement", color="red", style="bold") >> notes

print("Data model diagram created: data_model.png")
