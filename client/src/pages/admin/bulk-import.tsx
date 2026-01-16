import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';

export default function BulkImport() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [jsonData, setJsonData] = useState('');

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const handleMassImport = async () => {
    if (!jsonData.trim()) {
      showMessage('Введите JSON данные', 'error');
      return;
    }

    try {
      const products = JSON.parse(jsonData);

      if (!Array.isArray(products)) {
        showMessage('JSON должен быть массивом товаров', 'error');
        return;
      }

      setLoading(true);
      let successCount = 0;

      for (const product of products) {
        try {
          const response = await fetch('/api/admin/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product),
            credentials: 'include'
          });

          if (response.ok) {
            successCount++;
          }
        } catch (error) {
          // Ошибка создания товара
        }
      }

      showMessage(`Импортировано ${successCount} из ${products.length} товаров`, 'success');
      setJsonData('');
    } catch (error) {
      showMessage('Неверный формат JSON', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Массовый импорт товаров</h1>
        <p className="text-muted-foreground">
          Импорт товаров из JSON данных
        </p>
      </div>

      {message && (
        <Alert className={messageType === 'error' ? 'border-red-500' : 'border-green-500'}>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Массовый импорт JSON</CardTitle>
          <CardDescription>
            Вставьте JSON массив с товарами
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="jsonData">JSON данные</Label>
            <Textarea
              id="jsonData"
              value={jsonData}
              onChange={(e) => setJsonData(e.target.value)}
              placeholder='[{"name": "Товар 1", "price": 1000, "description": "Описание", "category": "Категория", "sku": "SKU"}]'
              rows={15}
            />
          </div>
          <Button onClick={handleMassImport} disabled={loading || !jsonData.trim()}>
            {loading ? 'Импорт...' : 'Импортировать JSON'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}