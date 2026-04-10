import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
  // Разрешаем запросы со всех доменов (CORS)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const db = client.db('iptv_db'); // Убедись, что название базы данных верное
    const collection = db.collection('clients');

    if (req.method === 'GET') {
      const clients = await collection.find({}).toArray();
      return res.status(200).json(clients);
    }

    if (req.method === 'POST') {
      const { nick, status, price, renewalDate } = req.body;

      if (!nick) {
        return res.status(400).json({ error: 'Ник обязателен' });
      }

      // Ищем клиента по нику и обновляем его данные
      const result = await collection.updateOne(
        { nick: nick },
        { 
          $set: { 
            status: status, 
            price: price, 
            renewalDate: renewalDate,
            updatedAt: new Date() 
          } 
        },
        { upsert: true } // Если клиента нет, он будет создан
      );

      console.log(`Обновлен клиент: ${nick}, Статус: ${status}`);
      return res.status(200).json({ message: 'Статус обновлен', result });
    }

  } catch (error) {
    console.error('Ошибка сервера:', error);
    return res.status(500).json({ error: 'Ошибка базы данных', details: error.message });
  } finally {
    await client.close();
  }
}
