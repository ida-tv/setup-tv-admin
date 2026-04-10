import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const collection = client.db('iptv_db').collection('clients');

    if (req.method === 'POST') {
      const { nick, status } = req.body;
      await collection.updateOne({ nick: nick }, { $set: { status: status } }, { upsert: true });
      return res.status(200).json({ success: true });
    }
    
    const clients = await collection.find({}).toArray();
    return res.status(200).json(clients);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  } finally {
    await client.close();
  }
}
