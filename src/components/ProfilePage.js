import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { Card, Button, Row, Col, Container, Modal, Form, Alert } from "react-bootstrap";

const ProfilePage = () => {
  const { user, token } = useContext(AuthContext);
  const [inventories, setInventories] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const navigate = useNavigate();

  // ----- Create Modal State -----
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newInventory, setNewInventory] = useState({
    title: "",
    description: "",
    category: "",
    customFields: { stringFields: [], numberFields: [], booleanFields: [], dropdownFields: [] },
  });
  const [createError, setCreateError] = useState("");

  // ----- Edit Modal State -----
  const [showEditModal, setShowEditModal] = useState(false);
  const [editInventory, setEditInventory] = useState({
    _id: "",
    title: "",
    description: "",
    category: "",
    customFields: { stringFields: [], numberFields: [], booleanFields: [], dropdownFields: [] },
  });
  const [editError, setEditError] = useState("");

  // ----- Temp states for adding fields -----
  const [tempString, setTempString] = useState("");
  const [tempNumber, setTempNumber] = useState("");
  const [tempBoolean, setTempBoolean] = useState("");
  const [tempDropdown, setTempDropdown] = useState("");

  // ----- Fetch inventories & total items -----
  useEffect(() => {
    const fetchInventories = async () => {
      try {
        const res = await api.get("/inventories/my", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setInventories(res.data);

        // Calculate total items
        let itemCount = 0;
        for (const inv of res.data) {
          const itemsRes = await api.get(`/inventories/${inv._id}/items`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          itemCount += itemsRes.data.length;
        }
        setTotalItems(itemCount);
      } catch (err) {
        console.error("Error fetching inventories:", err);
      }
    };

    if (token) fetchInventories();
  }, [token]);

  // ----- Add Field Helper -----
  const addField = (inventory, setInventory, type, value, resetValue) => {
    if (!value) return;
    setInventory({
      ...inventory,
      customFields: {
        ...inventory.customFields,
        [type]: [...inventory.customFields[type], type === "booleanFields" ? value === "true" : value],
      },
    });
    resetValue(""); // reset input
  };

  // ----- Delete Inventory -----
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this inventory?")) return;
    try {
      await api.delete(`/inventories/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInventories(inventories.filter((inv) => inv._id !== id));
    } catch (err) {
      console.error("Error deleting inventory:", err);
    }
  };

  // ----- Create Modal Handlers -----
  const handleCreateModalShow = () => setShowCreateModal(true);
  const handleCreateModalClose = () => {
    setShowCreateModal(false);
    setNewInventory({
      title: "",
      description: "",
      category: "",
      customFields: { stringFields: [], numberFields: [], booleanFields: [], dropdownFields: [] },
    });
    setCreateError("");
    setTempString("");
    setTempNumber("");
    setTempBoolean("");
    setTempDropdown("");
  };
  const handleCreateInventory = async () => {
    setCreateError("");
    if (!newInventory.title) {
      setCreateError("Title is required");
      return;
    }
    try {
      const res = await api.post("/inventories", newInventory, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInventories([res.data, ...inventories]);
      handleCreateModalClose();
    } catch (err) {
      setCreateError(err.response?.data?.message || "Failed to create inventory");
    }
  };

  // ----- Edit Modal Handlers -----
  const handleEditShow = (inv) => {
    setEditInventory({ ...inv });
    setShowEditModal(true);
    setTempString("");
    setTempNumber("");
    setTempBoolean("");
    setTempDropdown("");
    setEditError("");
  };
  const handleEditClose = () => {
    setShowEditModal(false);
    setEditInventory({
      _id: "",
      title: "",
      description: "",
      category: "",
      customFields: { stringFields: [], numberFields: [], booleanFields: [], dropdownFields: [] },
    });
    setEditError("");
  };
  const handleEditSubmit = async () => {
    setEditError("");
    if (!editInventory.title) {
      setEditError("Title is required");
      return;
    }
    try {
      const res = await api.put(`/inventories/${editInventory._id}`, editInventory, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInventories(
        inventories.map((inv) => (inv._id === res.data._id ? res.data : inv))
      );
      handleEditClose();
    } catch (err) {
      setEditError(err.response?.data?.message || "Failed to update inventory");
    }

  };
  const [contextMenu, setContextMenu] = useState({
  visible: false,
  x: 0,
  y: 0,
  inventory: null,
});


  return (
    <Container className="py-5">
      <h1 className="mb-4">{user?.username}’s Dashboard</h1>

      {/* Summary Cards */}
      <Row className="mb-4">
        <Col md={6}>
          <Card bg="primary" text="white" className="mb-3">
            <Card.Body>
              <Card.Title>Total Inventories</Card.Title>
              <Card.Text className="display-6">{inventories.length}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card bg="success" text="white" className="mb-3">
            <Card.Body>
              <Card.Title>Total Items</Card.Title>
              <Card.Text className="display-6">{totalItems}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Create Inventory Button */}
      <Row className="mb-3">
        <Col className="text-end">
          <Button variant="primary" onClick={handleCreateModalShow}>
            + Create Inventory
          </Button>
        </Col>
      </Row>

     {/* Inventory List */}
    <h3 className="mb-3">My Inventories</h3>
    <Row xs={1} md={2} lg={3} className="g-4">
      {inventories.map((inv) => (
        <Col key={inv._id}>
          <Card
            className="h-100 shadow-sm"
            style={{ cursor: "pointer", position: "relative" }}
            onClick={() => navigate(`/inventory/${inv._id}`)} // Single-click → details
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu({
                visible: true,
                x: e.pageX,
                y: e.pageY,
                inventory: inv,
              });
            }}
          >
            <Card.Body className="d-flex flex-column">
              <Card.Title>{inv.title}</Card.Title>
              <Card.Text className="flex-grow-1">{inv.description}</Card.Text>
              <Card.Text className="text-muted mb-2">Category: {inv.category}</Card.Text>
              <Card.Text className="text-primary mb-3">
                String Fields: {inv.customFields?.stringFields.join(", ")} | 
                Number Fields: {inv.customFields?.numberFields.join(", ")} | 
                Boolean Fields: {inv.customFields?.booleanFields.map(v => v.toString()).join(", ")} | 
                Dropdown Fields: {inv.customFields?.dropdownFields.join(", ")}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      ))}
    
      {/* Right-click context menu */}
      {contextMenu.visible && (
        <div
          style={{
            position: "absolute",
            top: contextMenu.y,
            left: contextMenu.x,
            background: "white",
            border: "1px solid #ccc",
            borderRadius: "4px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            zIndex: 1000,
            width: "120px",
          }}
        >
          <div
            style={{ padding: "8px", cursor: "pointer" }}
            onClick={() => {
              handleEditShow(contextMenu.inventory); // Edit
              setContextMenu({ ...contextMenu, visible: false });
            }}
          >
            Edit
          </div>
          <div
            style={{ padding: "8px", cursor: "pointer", color: "red" }}
            onClick={() => {
              if (window.confirm("Are you sure you want to delete this inventory?")) {
                handleDelete(contextMenu.inventory._id);
              }
              setContextMenu({ ...contextMenu, visible: false });
            }}
          >
            Delete
          </div>
        </div>
      )}
    </Row>


      {/* ----- Create Modal ----- */}
      <Modal show={showCreateModal} onHide={handleCreateModalClose}>
        <Modal.Header closeButton>
          <Modal.Title>Create Inventory</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {createError && <Alert variant="danger">{createError}</Alert>}
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                value={newInventory.title}
                onChange={(e) => setNewInventory({ ...newInventory, title: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={newInventory.description}
                onChange={(e) => setNewInventory({ ...newInventory, description: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Control
                type="text"
                value={newInventory.category}
                onChange={(e) => setNewInventory({ ...newInventory, category: e.target.value })}
              />
            </Form.Group>

            <hr />
            <h6>Custom Fields</h6>

            {/* String Field */}
            <Form.Group className="mb-3">
              <Form.Label>String Field</Form.Label>
              <div className="d-flex">
                <Form.Control value={tempString} onChange={(e) => setTempString(e.target.value)} />
                <Button
                  className="ms-2"
                  onClick={() => addField(newInventory, setNewInventory, "stringFields", tempString, setTempString)}
                >
                  Add
                </Button>
              </div>
              <div>{newInventory.customFields.stringFields.join(", ")}</div>
            </Form.Group>

            {/* Number Field */}
            <Form.Group className="mb-3">
              <Form.Label>Number Field</Form.Label>
              <div className="d-flex">
                <Form.Control
                  type="number"
                  value={tempNumber}
                  onChange={(e) => setTempNumber(e.target.value)}
                />
                <Button
                  className="ms-2"
                  onClick={() => addField(newInventory, setNewInventory, "numberFields", Number(tempNumber), setTempNumber)}
                >
                  Add
                </Button>
              </div>
              <div>{newInventory.customFields.numberFields.join(", ")}</div>
            </Form.Group>

            {/* Boolean Field */}
            <Form.Group className="mb-3">
              <Form.Label>Boolean Field</Form.Label>
              <div className="d-flex">
                <Form.Select value={tempBoolean} onChange={(e) => setTempBoolean(e.target.value)}>
                  <option value="">Select</option>
                  <option value="true">True</option>
                  <option value="false">False</option>
                </Form.Select>
                <Button
                  className="ms-2"
                  onClick={() => addField(newInventory, setNewInventory, "booleanFields", tempBoolean, setTempBoolean)}
                >
                  Add
                </Button>
              </div>
              <div>{newInventory.customFields.booleanFields.map(v => v.toString()).join(", ")}</div>
            </Form.Group>

            {/* Dropdown Field */}
            <Form.Group className="mb-3">
              <Form.Label>Dropdown Field</Form.Label>
              <div className="d-flex">
                <Form.Control value={tempDropdown} onChange={(e) => setTempDropdown(e.target.value)} />
                <Button
                  className="ms-2"
                  onClick={() => addField(newInventory, setNewInventory, "dropdownFields", tempDropdown, setTempDropdown)}
                >
                  Add
                </Button>
              </div>
              <div>{newInventory.customFields.dropdownFields.join(", ")}</div>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCreateModalClose}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleCreateInventory}>
            Create
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ----- Edit Modal ----- */}
      <Modal show={showEditModal} onHide={handleEditClose}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Inventory</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editError && <Alert variant="danger">{editError}</Alert>}
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                value={editInventory.title}
                onChange={(e) => setEditInventory({ ...editInventory, title: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={editInventory.description}
                onChange={(e) => setEditInventory({ ...editInventory, description: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Control
                type="text"
                value={editInventory.category}
                onChange={(e) => setEditInventory({ ...editInventory, category: e.target.value })}
              />
            </Form.Group>

            <hr />
            <h6>Custom Fields</h6>

            {/* String Field */}
            <Form.Group className="mb-3">
              <Form.Label>String Field</Form.Label>
              <div className="d-flex">
                <Form.Control value={tempString} onChange={(e) => setTempString(e.target.value)} />
                <Button
                  className="ms-2"
                  onClick={() => addField(editInventory, setEditInventory, "stringFields", tempString, setTempString)}
                >
                  Add
                </Button>
              </div>
              <div>{editInventory.customFields.stringFields.join(", ")}</div>
            </Form.Group>

            {/* Number Field */}
            <Form.Group className="mb-3">
              <Form.Label>Number Field</Form.Label>
              <div className="d-flex">
                <Form.Control
                  type="number"
                  value={tempNumber}
                  onChange={(e) => setTempNumber(e.target.value)}
                />
                <Button
                  className="ms-2"
                  onClick={() => addField(editInventory, setEditInventory, "numberFields", Number(tempNumber), setTempNumber)}
                >
                  Add
                </Button>
              </div>
              <div>{editInventory.customFields.numberFields.join(", ")}</div>
            </Form.Group>

            {/* Boolean Field */}
            <Form.Group className="mb-3">
              <Form.Label>Boolean Field</Form.Label>
              <div className="d-flex">
                <Form.Select value={tempBoolean} onChange={(e) => setTempBoolean(e.target.value)}>
                  <option value="">Select</option>
                  <option value="true">True</option>
                  <option value="false">False</option>
                </Form.Select>
                <Button
                  className="ms-2"
                  onClick={() => addField(editInventory, setEditInventory, "booleanFields", tempBoolean, setTempBoolean)}
                >
                  Add
                </Button>
              </div>
              <div>{editInventory.customFields.booleanFields.map(v => v.toString()).join(", ")}</div>
            </Form.Group>

            {/* Dropdown Field */}
            <Form.Group className="mb-3">
              <Form.Label>Dropdown Field</Form.Label>
              <div className="d-flex">
                <Form.Control value={tempDropdown} onChange={(e) => setTempDropdown(e.target.value)} />
                <Button
                  className="ms-2"
                  onClick={() => addField(editInventory, setEditInventory, "dropdownFields", tempDropdown, setTempDropdown)}
                >
                  Add
                </Button>
              </div>
              <div>{editInventory.customFields.dropdownFields.join(", ")}</div>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleEditClose}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleEditSubmit}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ProfilePage;
