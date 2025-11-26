import { getCollection } from "@/lib/dbConnection";

// GET /api/products
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const minPrice = parseFloat(searchParams.get("minPrice")) || 0;
    const maxPrice = parseFloat(searchParams.get("maxPrice")) || 1_000_000;
    const sort = searchParams.get("sort") || "default";
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 8;

    const productsCollection = await getCollection("products");

    const query = {
      price: { $gte: minPrice, $lte: maxPrice },
      ...(search ? { title: { $regex: search, $options: "i" } } : {}),
      ...(category ? { category } : {}),
    };

    let sortOption = {};
    if (sort === "price-low") sortOption = { price: 1 };
    if (sort === "price-high") sortOption = { price: -1 };
    if (sort === "name") sortOption = { title: 1 };

    const totalCount = await productsCollection.countDocuments(query);

    const products = await productsCollection
      .find(query)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    return new Response(
      JSON.stringify({
        products,
        totalPages: Math.ceil(totalCount / limit),
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("GET /api/products ERROR:", err);
    return new Response(
      JSON.stringify({ error: "Failed to fetch products", details: err.message }),
      { status: 500 }
    );
  }
}

// POST /api/products
export async function POST(req) {
  try {
    const body = await req.json();
    console.log("POST BODY:", body);

    // Validate required fields
    if (!body.title || !body.price) {
      return new Response(JSON.stringify({ error: "Missing title or price" }), { status: 400 });
    }

    // Convert numeric fields
    body.price = Number(body.price);
    body.discountPrice = Number(body.discountPrice) || 0;

    if (body.rating) {
      body.rating = {
        average: Number(body.rating.average) || 0,
        count: Number(body.rating.count) || 0,
      };
    } else {
      body.rating = { average: 0, count: 0 };
    }

    if (body.variants) {
      body.variants = body.variants.map((v) => ({
        ...v,
        sizes: v.sizes.map((s) => ({
          size: s.size,
          stock: Number(s.stock) || 0,
        })),
      }));
    }

    body.createdAt = new Date().toISOString();
    body.updatedAt = new Date().toISOString();

    const productsCollection = await getCollection("products");

    const result = await productsCollection.insertOne(body);

    console.log("✅ Product inserted:", result.insertedId);

    return new Response(
      JSON.stringify({ ...body, _id: result.insertedId }),
      { status: 201 }
    );
  } catch (err) {
    console.error("POST PRODUCT ERROR:", err);
    return new Response(
      JSON.stringify({ error: "Failed to create product", details: err.message }),
      { status: 500 }
    );
  }
}
