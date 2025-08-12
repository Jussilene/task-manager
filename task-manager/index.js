const { MongoClient } = require("mongodb");

// Substitua pelos seus valores:
const USER = "jussilenevalim";        // ou "taskuser"
const PASS = "Y@s11/03";  // a senha do usuário de banco

const uri =
  `mongodb+srv://${encodeURIComponent(USER)}:${encodeURIComponent(PASS)}@cluster0.jpxbryo.mongodb.net/` +
  `?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log("✅ Conectado ao MongoDB Atlas!");

    const database = client.db("meuBanco");              // DB de teste
    const collection = database.collection("minhaColecao");

    const doc = { nome: "Ju", projeto: "Conexão Atlas" };
    const res = await collection.insertOne(doc);

    console.log("📌 Inserido com _id:", res.insertedId);
  } catch (err) {
    console.error("❌ Erro de conexão:", err);
  } finally {
    await client.close();
  }
}

run();
