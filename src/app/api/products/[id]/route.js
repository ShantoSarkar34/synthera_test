import { getCollection } from "@/lib/dbConnection";
import { ObjectId } from "mongodb";

// Simple authentication for PUT & DELETE
async function authenticate(req) {
  const token = req.headers.get("authorization")?.split(" ")[1];
  return token === process.env.ADMIN_TOKEN;
}

// Helper to create a query supporting both ObjectId and string _id
function buildIdQuery(id) {
  if (ObjectId.isValid(id)) {
    return { $or: [{ _id: new ObjectId(id) }, { _id: id }] };
  } else {
    return { _id: id };
  }
}

// GET /api/products/:id
export async function GET(req, { params }) {
  try {
    const { id } = await params; // unwrap the promise
    console.log("FETCHING PRODUCT ID:", id);

    const db = await getCollection("products");

    const product = await db.findOne(buildIdQuery(id));

    if (!product) {
      return new Response(JSON.stringify({ error: "Product not found" }), { status: 404 });
    }

    return new Response(JSON.stringify(product), { status: 200 });
  } catch (err) {
    console.error("🔥 GET SINGLE PRODUCT ERROR:", err);
    return new Response(JSON.stringify({ error: "Failed to fetch product" }), { status: 500 });
  }
}

// PUT /api/products/:id
export async function PUT(req, { params }) {
  const isAuth = await authenticate(req);
  if (!isAuth) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  try {
    const { id } = await params;
    const updatedData = await req.json();

    const db = await getCollection("products");

    const result = await db.updateOne(buildIdQuery(id), { $set: updatedData });

    if (result.matchedCount === 0) {
      return new Response(JSON.stringify({ error: "Product not found" }), { status: 404 });
    }

    return new Response(JSON.stringify({ message: "Product updated", modifiedCount: result.modifiedCount }), { status: 200 });
  } catch (err) {
    console.error("🔥 UPDATE PRODUCT ERROR:", err);
    return new Response(JSON.stringify({ error: "Failed to update product" }), { status: 500 });
  }
}

// DELETE /api/products/:id
export async function DELETE(req, { params }) {
  const isAuth = await authenticate(req);
  if (!isAuth) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  try {
    const { id } = await params;

    const db = await getCollection("products");

    const result = await db.deleteOne(buildIdQuery(id));

    if (result.deletedCount === 0) {
      return new Response(JSON.stringify({ error: "Product not found" }), { status: 404 });
    }

    return new Response(JSON.stringify({ message: "Product deleted", deletedCount: result.deletedCount }), { status: 200 });
  } catch (err) {
    console.error("🔥 DELETE PRODUCT ERROR:", err);
    return new Response(JSON.stringify({ error: "Failed to delete product" }), { status: 500 });
  }
}
