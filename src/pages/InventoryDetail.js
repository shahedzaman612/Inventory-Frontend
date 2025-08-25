import { useEffect, useState, useContext } from "react";
import {
  Container,
  Row,
  Col,
  Table,
  Button,
  Modal,
  Form,
  Alert,
} from "react-bootstrap";
import { useParams } from "react-router-dom";
import api from "../services/api";
import { AuthContext } from "../contexts/AuthContext";

const InventoryDetail = () => {
  const { inventoryId } = useParams();
  const { user } = useContext(AuthContext);

  const [inventory, setInventory] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalItem, setModalItem] = useState({
    itemId: "",
    name: "",
    quantity: "",
  });
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const invRes = await api.get("/inventories");
        const inv = invRes.data.find((inv) => inv._id === inventoryId);
        setInventory(inv);

        const itemRes = await api.get(`/inventories/${inventoryId}/items`);
        // When fetching items
        setItems(
          itemRes.data.map((item) => ({
            _id: item._id, // MongoDB id
            itemId: item.itemId,
            name: item.name,
            quantity: item.quantity,
          }))
        );

        setLoading(false);
      } catch (err) {
        console.error(err);
      }
    };
    fetchInventory();
  }, [inventoryId]);

  const handleModalClose = () => {
    setShowModal(false);
    setModalItem({ itemId: "", name: "", quantity: "" });
    setError("");
    setEditMode(false);
  };

  const handleModalShow = (item = null) => {
    if (item) {
      setModalItem({
        _id: item._id,
        itemId: item.itemId,
        name: item.name,
        quantity: item.quantity,
      });
      setEditMode(true);
    }
    setShowModal(true);
  };

  const handleSaveItem = async () => {
    setError("");
    if (!modalItem.itemId || !modalItem.name || !modalItem.quantity) {
      setError("All fields are required");
      return;
    }

    try {
      if (editMode) {
        const res = await api.put(
          `/inventories/${inventoryId}/items/${modalItem._id}`, // use _id
          modalItem
        );
        setItems(items.map((i) => (i._id === modalItem._id ? res.data : i)));
      } else {
        const res = await api.post(
          `/inventories/${inventoryId}/items`,
          modalItem
        );
        setItems([res.data, ...items]);
      }
      handleModalClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save item");
    }
  };

  const handleDeleteItem = async (_id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      await api.delete(`/inventories/${inventoryId}/items/${_id}`); // use _id
      setItems(items.filter((i) => i._id !== _id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <Container className="mt-5">Loading...</Container>;

  // Only creator or admin can edit/delete items
  // Only creator or admin can edit/delete items
  const canEditOrDeleteItems =
    inventory?.userId?._id === user.id || user.role === "admin";
  return (
    <Container className="mt-4">
      <Row className="mb-3">
        <Col>
          <h2>Inventory: {inventory?.title}</h2>
          <p>Category: {inventory?.category}</p>
          <p>Description: {inventory?.description}</p>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col className="text-end">
          {/* Everyone can add items */}
          <Button variant="primary" onClick={() => handleModalShow()}>
            + Add Item
          </Button>
        </Col>
      </Row>

      <Row>
        {items.length === 0 ? (
          <p>No items in this inventory.</p>
        ) : (
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Item ID</th>
                <th>Name</th>
                <th>Quantity</th>
                {canEditOrDeleteItems && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id}>
                  <td>{item.itemId}</td>
                  <td>{item.name}</td>
                  <td>{item.quantity}</td>
                  {canEditOrDeleteItems && (
                    <td>
                      <Button
                        variant="warning"
                        size="sm"
                        className="me-2"
                        onClick={() => handleModalShow(item)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteItem(item._id)} // use _id
                      >
                        Delete
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Row>

      {/* Add/Edit Item Modal */}
      <Modal show={showModal} onHide={handleModalClose}>
        <Modal.Header closeButton>
          <Modal.Title>{editMode ? "Edit Item" : "Add Item"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Item ID</Form.Label>
              <Form.Control
                type="text"
                value={modalItem.itemId}
                onChange={(e) =>
                  setModalItem({ ...modalItem, itemId: e.target.value })
                }
                placeholder="Enter unique Item ID or leave blank to auto-generate"
                disabled={editMode && !canEditOrDeleteItems}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                value={modalItem.name}
                onChange={(e) =>
                  setModalItem({ ...modalItem, name: e.target.value })
                }
                disabled={editMode && !canEditOrDeleteItems}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Quantity</Form.Label>
              <Form.Control
                type="number"
                value={modalItem.quantity}
                onChange={(e) =>
                  setModalItem({ ...modalItem, quantity: e.target.value })
                }
                disabled={editMode && !canEditOrDeleteItems}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleModalClose}>
            Cancel
          </Button>
          {(!editMode || canEditOrDeleteItems) && (
            <Button variant="primary" onClick={handleSaveItem}>
              {editMode ? "Update" : "Add"}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default InventoryDetail;
