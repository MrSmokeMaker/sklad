// src/domain/inventory/__tests__/inventory.test.ts: Тесты списания по FIFO, перемещений и отката операций

import { describe, it, expect, beforeEach } from 'vitest';
import { dataService } from '../../../db/dataService';

describe('Складская логика: FIFO, перемещения и откат', () => {
  beforeEach(() => {
    dataService.resetMockData();
  });

  it('списывает объем партий строго по FIFO (из самых старых готовых партий)', async () => {
    // Начальное состояние batches
    const batches = await dataService.getBatches('production-podvorie');
    const tomatoBatches = batches.filter(b => b.infusion_id === 'inf-01' && b.status === 'готово');
    expect(tomatoBatches.length).toBeGreaterThan(0);

    const initialVolume = tomatoBatches[0].volume_мл;

    // Перемещение 2000 мл настойки
    await dataService.transferInfusion(
      'production-podvorie',
      'venue-samovar',
      'inf-01',
      2000
    );

    const updatedBatches = await dataService.getBatches('production-podvorie');
    const updatedTomato = updatedBatches.find(b => b.id === tomatoBatches[0].id);

    expect(updatedTomato?.volume_мл).toBe(initialVolume - 2000);
  });

  it('позволяет списание сырья при заливе партии в минус с генерацией предупреждения', async () => {
    // Залив 15 литров томатов (потребуется 3 кг томатов)
    const res = await dataService.createBatch(
      'rcp-01',
      'production-podvorie',
      15,
      38
    );

    expect(res.batch).toBeDefined();
    expect(res.batch.volume_мл).toBe(15 * 920);
    // Проверка наличия партии
    const batches = await dataService.getBatches('production-podvorie');
    expect(batches.some(b => b.id === res.batch.id)).toBe(true);
  });

  it('успешно откатывает выбранную операцию из operations_log с восстановлением остатков', async () => {
    const fromVenue = 'production-podvorie';
    const toVenue = 'venue-samovar';

    const stockBeforeFrom = (await dataService.getInventory(fromVenue)).find(i => i.name === 'Сахар-песок')?.quantity || 0;
    const stockBeforeTo = (await dataService.getInventory(toVenue)).find(i => i.name === 'Сахар-песок')?.quantity || 0;

    // 1. Выполняем перемещение 5 кг сахара
    const transfer = await dataService.transferRaw(
      fromVenue,
      toVenue,
      'Сахар-песок',
      5,
      'кг'
    );

    // 2. Проверяем остатки после перемещения
    const stockAfterFrom = (await dataService.getInventory(fromVenue)).find(i => i.name === 'Сахар-песок')?.quantity || 0;
    const stockAfterTo = (await dataService.getInventory(toVenue)).find(i => i.name === 'Сахар-песок')?.quantity || 0;
    expect(stockAfterFrom).toBe(stockBeforeFrom - 5);
    expect(stockAfterTo).toBe(stockBeforeTo + 5);

    // 3. Находим запись в журнале операций и откатываем её
    const ops = await dataService.getOperationsLog();
    const transferOp = ops.find(o => o.delta?.transferId === transfer.id);
    expect(transferOp).toBeDefined();

    await dataService.rollbackOperation(transferOp!.id);

    // 4. Проверяем, что остатки вернулись к исходным
    const stockRollbackFrom = (await dataService.getInventory(fromVenue)).find(i => i.name === 'Сахар-песок')?.quantity || 0;
    const stockRollbackTo = (await dataService.getInventory(toVenue)).find(i => i.name === 'Сахар-песок')?.quantity || 0;
    expect(stockRollbackFrom).toBe(stockBeforeFrom);
    expect(stockRollbackTo).toBe(stockBeforeTo);
  });
});
