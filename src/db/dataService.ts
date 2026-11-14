// src/db/dataService.ts: Автономный локальный слой данных приложения (IndexedDB + localStorage)

import {
  Venue, Profile, InventoryItem, Recipe, Infusion, InfusionSet,
  Batch, Transfer, Sale, NameMapping, OperationsLog, Invite, AIIntent, ShowcaseItem
} from '../types';
import { INITIAL_SHOWCASE_ITEMS } from './showcaseData';
import { localDB } from './localDatabase';
import * as mock from './mockData';

class DataService {
  private useMock: boolean = true;
  private currentUserId: string = 'usr-owner-01'; // Default demo user

  // Локальное реактивное состояние (кэш в памяти с сохранением в IndexedDB и localStorage)
  private state = {
    venues: [...mock.INITIAL_VENUES],
    profiles: [...mock.INITIAL_PROFILES],
    inventory: [...mock.INITIAL_INVENTORY],
    recipes: [...mock.INITIAL_RECIPES],
    infusions: [...mock.INITIAL_INFUSIONS],
    sets: [...mock.INITIAL_SETS],
    batches: [...mock.INITIAL_BATCHES],
    transfers: [...mock.INITIAL_TRANSFERS],
    sales: [...mock.INITIAL_SALES],
    nameMapping: [...mock.INITIAL_NAME_MAPPING],
    operationsLog: [...mock.INITIAL_OPERATIONS_LOG],
    invites: [...mock.INITIAL_INVITES],
    showcase: [...INITIAL_SHOWCASE_ITEMS],
  };

  private lastAiRequestTimestamp: number = 0;

  constructor() {
    this.loadFromStorage();
  }

  // ---------- Резервное копирование и экспорт ----------
  public async exportBackup(): Promise<string> {
    return JSON.stringify(this.state, null, 2);
  }

  public async importBackup(jsonString: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && typeof parsed === 'object') {
        this.state = { ...this.state, ...parsed };
        this.saveToStorage();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // ---------- Showcase (Гостевая витрина) ----------
  public async getShowcaseItems(): Promise<ShowcaseItem[]> {
    return this.state.showcase;
  }

  public async addShowcaseItem(item: Omit<ShowcaseItem, 'id'>): Promise<ShowcaseItem> {
    const newItem: ShowcaseItem = {
      ...item,
      id: 'sc-' + Date.now(),
      created_at: new Date().toISOString()
    };
    this.state.showcase.unshift(newItem);
    this.saveToStorage();
    return newItem;
  }

  private saveToStorage() {
    try {
      localStorage.setItem('sklad_state_v2', JSON.stringify(this.state));
    } catch {
      // Игнорируем в SSR / тестах
    }
    localDB.saveState(this.state).catch(() => {});
  }

  private async loadFromStorage() {
    try {
      const fromIDB = await localDB.loadState();
      if (fromIDB) {
        this.state = { ...this.state, ...fromIDB };
        return;
      }
      const saved = localStorage.getItem('sklad_state_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.state = { ...this.state, ...parsed };
      }
    } catch {
      // Игнорируем
    }
  }

  public resetMockData() {
    this.state = {
      venues: [...mock.INITIAL_VENUES],
      profiles: [...mock.INITIAL_PROFILES],
      inventory: [...mock.INITIAL_INVENTORY],
      recipes: [...mock.INITIAL_RECIPES],
      infusions: [...mock.INITIAL_INFUSIONS],
      sets: [...mock.INITIAL_SETS],
      batches: [...mock.INITIAL_BATCHES],
      transfers: [...mock.INITIAL_TRANSFERS],
      sales: [...mock.INITIAL_SALES],
      nameMapping: [...mock.INITIAL_NAME_MAPPING],
      operationsLog: [...mock.INITIAL_OPERATIONS_LOG],
      invites: [...mock.INITIAL_INVITES],
      showcase: [...INITIAL_SHOWCASE_ITEMS],
    };
    this.saveToStorage();
  }

  public isMockMode(): boolean {
    return this.useMock;
  }

  public setMockMode(val: boolean) {
    this.useMock = val;
  }

  public setCurrentUserId(userId: string) {
    this.currentUserId = userId;
  }

  public getCurrentProfile(): Profile {
    const p = this.state.profiles.find(x => x.id === this.currentUserId);
    return p || this.state.profiles[0];
  }

  // --- Справочники ---
  public async getVenues(): Promise<Venue[]> {
    return this.state.venues;
  }

  public async getProfiles(): Promise<Profile[]> {
    return this.state.profiles;
  }

  public async updateProfileRole(profileId: string, role: Profile['role'], venueId: string | null): Promise<void> {
    const idx = this.state.profiles.findIndex(p => p.id === profileId);
    if (idx !== -1) {
      this.state.profiles[idx] = { ...this.state.profiles[idx], role, venue_id: venueId };
      this.saveToStorage();
    }
  }

  // --- Приглашения (Invites) ---
  public async getInvites(): Promise<Invite[]> {
    return this.state.invites.filter(i => !i.used_at);
  }

  public async createInvite(role: Profile['role'], venueId: string | null): Promise<Invite> {
    const newInvite: Invite = {
      id: 'inv-' + Date.now(),
      token: crypto.randomUUID ? crypto.randomUUID() : 'tok-' + Math.random().toString(36).substring(2, 9),
      role,
      venue_id: venueId,
      created_by: this.currentUserId,
      expires_at: new Date(Date.now() + 86400000 * 7).toISOString(),
      used_by: null,
      used_at: null,
      created_at: new Date().toISOString()
    };
    this.state.invites.unshift(newInvite);
    this.saveToStorage();
    return newInvite;
  }

  public async revokeInvite(inviteId: string): Promise<void> {
    this.state.invites = this.state.invites.filter(i => i.id !== inviteId);
    this.saveToStorage();
  }

  public async getInviteByToken(token: string): Promise<Invite | null> {
    const invite = this.state.invites.find(i => i.token === token && !i.used_at);
    if (!invite) return null;
    if (new Date(invite.expires_at) < new Date()) return null;
    return invite;
  }

  public async acceptInvite(token: string, email: string, fullName: string): Promise<Profile> {
    const invite = await this.getInviteByToken(token);
    if (!invite) throw new Error('Приглашение недействительно или устарело');

    const newProfile: Profile = {
      id: 'usr-' + Date.now(),
      email,
      full_name: fullName,
      role: invite.role,
      venue_id: invite.venue_id,
      created_at: new Date().toISOString()
    };

    invite.used_by = newProfile.id;
    invite.used_at = new Date().toISOString();

    this.state.profiles.push(newProfile);
    this.currentUserId = newProfile.id;
    this.saveToStorage();
    return newProfile;
  }

  // --- Склад (Inventory) ---
  public async getInventory(venueId?: string | null): Promise<InventoryItem[]> {
    if (venueId) {
      return this.state.inventory.filter(i => i.venue_id === venueId);
    }
    return this.state.inventory;
  }

  public async addInventoryItem(item: Omit<InventoryItem, 'id' | 'updated_at'>): Promise<InventoryItem> {
    const newItem: InventoryItem = {
      ...item,
      id: 'inv-' + Date.now(),
      updated_at: new Date().toISOString()
    };
    this.state.inventory.push(newItem);
    this.logOperation('add_inventory', `Добавлено сырьё: ${newItem.name} (${newItem.quantity} ${newItem.unit})`, {
      type: 'add_inventory',
      itemId: newItem.id
    });
    this.saveToStorage();
    return newItem;
  }

  public async updateInventoryStock(itemId: string, deltaQty: number): Promise<InventoryItem> {
    const item = this.state.inventory.find(i => i.id === itemId);
    if (!item) throw new Error('Позиция склада не найдена');

    const oldQty = item.quantity;
    item.quantity = Math.round((item.quantity + deltaQty) * 1000) / 1000;
    item.updated_at = new Date().toISOString();

    this.logOperation('adjust_stock', `Корректировка остатка: ${item.name} (${deltaQty > 0 ? '+' : ''}${deltaQty} ${item.unit})`, {
      type: 'adjust_stock',
      itemId,
      oldQty,
      newQty: item.quantity
    });

    this.saveToStorage();
    return item;
  }

  // --- Перемещение сырья (Raw Transfer) ---
  public async transferRaw(
    fromVenueId: string,
    toVenueId: string,
    itemName: string,
    qty: number,
    unit: InventoryItem['unit'],
    photoUrl?: string | null
  ): Promise<Transfer> {
    // 1. Списание у отправителя (допускается отрицательный остаток)
    let senderItem = this.state.inventory.find(i => i.venue_id === fromVenueId && i.name.toLowerCase() === itemName.toLowerCase());
    if (!senderItem) {
      senderItem = {
        id: 'inv-' + Date.now() + '-s',
        name: itemName,
        type: 'сырьё',
        venue_id: fromVenueId,
        quantity: -qty,
        unit,
        min_stock: 0
      };
      this.state.inventory.push(senderItem);
    } else {
      senderItem.quantity -= qty;
    }

    // 2. Пополнение у получателя
    let receiverItem = this.state.inventory.find(i => i.venue_id === toVenueId && i.name.toLowerCase() === itemName.toLowerCase());
    if (!receiverItem) {
      receiverItem = {
        id: 'inv-' + Date.now() + '-r',
        name: itemName,
        type: senderItem.type,
        venue_id: toVenueId,
        quantity: qty,
        unit,
        min_stock: 0
      };
      this.state.inventory.push(receiverItem);
    } else {
      receiverItem.quantity += qty;
    }

    const transfer: Transfer = {
      id: 'tr-' + Date.now(),
      transfer_date: new Date().toISOString(),
      from_venue_id: fromVenueId,
      to_venue_id: toVenueId,
      item_type: 'raw',
      qty,
      unit,
      created_by: this.currentUserId,
      photo_url: photoUrl
    };

    this.state.transfers.unshift(transfer);

    this.logOperation('transfer_raw', `Перемещение сырья: ${itemName} (${qty} ${unit})`, {
      type: 'transfer_raw',
      transferId: transfer.id,
      fromVenueId,
      toVenueId,
      itemName,
      qty,
      unit
    }, photoUrl);

    this.saveToStorage();
    return transfer;
  }

  // --- Рецепты и настойки ---
  public async getRecipes(): Promise<Recipe[]> {
    return this.state.recipes;
  }

  public async getInfusions(): Promise<Infusion[]> {
    return this.state.infusions;
  }

  public async getSets(): Promise<InfusionSet[]> {
    return this.state.sets;
  }

  public async addRecipe(recipe: Omit<Recipe, 'id'>): Promise<Recipe> {
    const newRecipe: Recipe = {
      ...recipe,
      id: 'rcp-' + Date.now()
    };
    this.state.recipes.push(newRecipe);

    // Автоматически создаем запись в infusions, если её нет
    const exists = this.state.infusions.some(inf => inf.name.toLowerCase() === newRecipe.title.toLowerCase());
    if (!exists) {
      this.state.infusions.push({
        id: 'inf-' + Date.now(),
        name: newRecipe.title,
        recipe_id: newRecipe.id
      });
    }

    this.saveToStorage();
    return newRecipe;
  }

  // --- Залив партии (Batch Creation) ---
  public async createBatch(
    recipeId: string,
    venueId: string,
    targetVolumeLiters: number,
    abv: number,
    photoUrl?: string | null
  ): Promise<{ batch: Batch; warnings: string[] }> {
    const recipe = this.state.recipes.find(r => r.id === recipeId);
    if (!recipe) throw new Error('Рецепт не найден');

    let infusion = this.state.infusions.find(i => i.recipe_id === recipeId || i.name.toLowerCase() === recipe.title.toLowerCase());
    if (!infusion) {
      infusion = {
        id: 'inf-' + Date.now(),
        name: recipe.title,
        recipe_id: recipe.id
      };
      this.state.infusions.push(infusion);
    }

    const warnings: string[] = [];
    const stockDeductions: Array<{ itemId: string; name: string; deducted: number; oldQty: number; newQty: number }> = [];

    // Списание сырья со склада заведения с учетом базового объёма техкарты
    const baseLiters = (recipe.base_volume_мл || 1000) / 1000;
    const factor = targetVolumeLiters / baseLiters;

    for (const ing of recipe.ingredients) {
      const required = ing.qty * factor;
      let stockItem = this.state.inventory.find(
        i => i.venue_id === venueId && i.name.toLowerCase() === ing.name.toLowerCase()
      );

      if (!stockItem) {
        warnings.push(`Ингредиент «${ing.name}» отсутствовал на складе. Записан отрицательный остаток: -${required} ${ing.unit}.`);
        stockItem = {
          id: 'inv-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          name: ing.name,
          type: 'сырьё',
          venue_id: venueId,
          quantity: -required,
          unit: ing.unit,
          min_stock: 0
        };
        this.state.inventory.push(stockItem);
        stockDeductions.push({ itemId: stockItem.id, name: ing.name, deducted: required, oldQty: 0, newQty: -required });
      } else {
        const oldQty = stockItem.quantity;
        // Конвертация единиц при необходимости
        let deductAmount = required;
        if (stockItem.unit === 'кг' && ing.unit === 'г') deductAmount = required / 1000;
        if (stockItem.unit === 'л' && ing.unit === 'мл') deductAmount = required / 1000;

        stockItem.quantity = Math.round((stockItem.quantity - deductAmount) * 1000) / 1000;
        if (stockItem.quantity < 0) {
          warnings.push(`Остаток сырья «${ing.name}» ушел в минус: ${stockItem.quantity} ${stockItem.unit}.`);
        }
        stockDeductions.push({ itemId: stockItem.id, name: ing.name, deducted: deductAmount, oldQty, newQty: stockItem.quantity });
      }
    }

    const readyDate = new Date();
    readyDate.setDate(readyDate.getDate() + recipe.days);

    const calculatedYieldMl = Math.round(factor * (recipe.yield_мл || 1400));

    const newBatch: Batch = {
      id: 'bat-' + Date.now(),
      infusion_id: infusion.id,
      venue_id: venueId,
      volume_мл: calculatedYieldMl,
      start_date: new Date().toISOString().split('T')[0],
      ready_date: readyDate.toISOString().split('T')[0],
      abv,
      status: 'настаивается',
      notes: `Залив на ${targetVolumeLiters} л. Расчетный выход: ${calculatedYieldMl} мл.`,
      photo_url: photoUrl,
      created_at: new Date().toISOString()
    };

    this.state.batches.unshift(newBatch);

    this.logOperation('create_batch', `Залив партии: ${recipe.title} (${targetVolumeLiters} л)`, {
      type: 'create_batch',
      batchId: newBatch.id,
      deductions: stockDeductions
    }, photoUrl);

    this.saveToStorage();
    return { batch: newBatch, warnings };
  }

  // --- Партии (Batches) ---
  public async getBatches(venueId?: string | null): Promise<Batch[]> {
    if (venueId) {
      return this.state.batches.filter(b => b.venue_id === venueId);
    }
    return this.state.batches;
  }

  public async updateBatchStatus(
    batchId: string,
    status: Batch['status'],
    rating?: number | null,
    notes?: string
  ): Promise<Batch> {
    const batch = this.state.batches.find(b => b.id === batchId);
    if (!batch) throw new Error('Партия не найдена');

    batch.status = status;
    if (rating !== undefined) batch.rating = rating;
    if (notes !== undefined) batch.notes = notes;

    this.saveToStorage();
    return batch;
  }

  // --- Перемещение настойки (Infusion Transfer по FIFO) ---
  public async transferInfusion(
    fromVenueId: string,
    toVenueId: string,
    infusionId: string,
    volumeMl: number,
    photoUrl?: string | null
  ): Promise<Transfer> {
    // 1. Поиск готовых партий у отправителя, сортировка по ready_date (FIFO)
    const availableBatches = this.state.batches
      .filter(b => b.venue_id === fromVenueId && b.infusion_id === infusionId && b.status === 'готово' && b.volume_мл > 0)
      .sort((a, b) => new Date(a.ready_date).getTime() - new Date(b.ready_date).getTime());

    let remainingToDeduct = volumeMl;
    const batchDeductions: Array<{ batchId: string; volumeMl: number }> = [];

    for (const batch of availableBatches) {
      if (remainingToDeduct <= 0) break;

      const deduct = Math.min(batch.volume_мл, remainingToDeduct);
      batch.volume_мл -= deduct;
      remainingToDeduct -= deduct;
      batchDeductions.push({ batchId: batch.id, volumeMl: deduct });
    }

    // Если готовых партий не хватило — списываем остаток с самой первой партии в минус для фиксации факта
    if (remainingToDeduct > 0) {
      if (availableBatches.length > 0) {
        availableBatches[0].volume_мл -= remainingToDeduct;
        batchDeductions[0].volumeMl += remainingToDeduct;
      } else {
        // Создаем фиктивную партию со списанием
        const fakeBatch: Batch = {
          id: 'bat-' + Date.now() + '-adj',
          infusion_id: infusionId,
          venue_id: fromVenueId,
          volume_мл: -remainingToDeduct,
          start_date: new Date().toISOString().split('T')[0],
          ready_date: new Date().toISOString().split('T')[0],
          abv: 38,
          status: 'готово',
          notes: 'Авто-корректировка при отгрузке сверх остатка'
        };
        this.state.batches.push(fakeBatch);
        batchDeductions.push({ batchId: fakeBatch.id, volumeMl: remainingToDeduct });
      }
    }

    // 2. Пополнение остатка у получателя (добавляем готовую партию получателю)
    const receiverBatch: Batch = {
      id: 'bat-' + Date.now() + '-rec',
      infusion_id: infusionId,
      venue_id: toVenueId,
      volume_мл: volumeMl,
      start_date: new Date().toISOString().split('T')[0],
      ready_date: new Date().toISOString().split('T')[0],
      abv: 38,
      status: 'готово',
      notes: `Поступило перемещением с ${fromVenueId}`,
      photo_url: photoUrl
    };
    this.state.batches.push(receiverBatch);

    const transfer: Transfer = {
      id: 'tr-' + Date.now(),
      transfer_date: new Date().toISOString(),
      from_venue_id: fromVenueId,
      to_venue_id: toVenueId,
      item_type: 'infusion',
      infusion_id: infusionId,
      qty: volumeMl,
      unit: 'мл',
      created_by: this.currentUserId,
      photo_url: photoUrl
    };

    this.state.transfers.unshift(transfer);

    const inf = this.state.infusions.find(i => i.id === infusionId);
    this.logOperation('transfer_infusion', `Перемещение настойки: ${inf?.name || 'Настойка'} (${volumeMl} мл)`, {
      type: 'transfer_infusion',
      transferId: transfer.id,
      fromVenueId,
      toVenueId,
      infusionId,
      volumeMl,
      receiverBatchId: receiverBatch.id,
      batchDeductions
    }, photoUrl);

    this.saveToStorage();
    return transfer;
  }

  // --- Журнал перемещений (Transfers) ---
  public async getTransfers(): Promise<Transfer[]> {
    return this.state.transfers;
  }

  // --- Журнал операций и откат (Operations Log & Rollback) ---
  public async getOperationsLog(): Promise<OperationsLog[]> {
    return this.state.operationsLog;
  }

  private logOperation(action: string, object: string, delta: any, photoUrl?: string | null) {
    const entry: OperationsLog = {
      id: 'op-' + Date.now(),
      created_at: new Date().toISOString(),
      user_id: this.currentUserId,
      action,
      object,
      delta,
      details: object,
      photo_url: photoUrl
    };
    this.state.operationsLog.unshift(entry);
    if (this.state.operationsLog.length > 100) {
      this.state.operationsLog.pop();
    }
  }

  /**
   * Откат выбранной операции из журнала
   */
  public async rollbackOperation(operationId: string): Promise<void> {
    const op = this.state.operationsLog.find(o => o.id === operationId);
    if (!op) throw new Error('Операция не найдена');

    const delta = op.delta;

    switch (delta.type) {
      case 'transfer_raw': {
        // Возвращаем отправителю и забираем у получателя
        const sender = this.state.inventory.find(i => i.venue_id === delta.fromVenueId && i.name.toLowerCase() === delta.itemName.toLowerCase());
        const receiver = this.state.inventory.find(i => i.venue_id === delta.toVenueId && i.name.toLowerCase() === delta.itemName.toLowerCase());
        if (sender) sender.quantity += delta.qty;
        if (receiver) receiver.quantity -= delta.qty;

        // Удаляем запись перемещения
        this.state.transfers = this.state.transfers.filter(t => t.id !== delta.transferId);
        break;
      }
      case 'transfer_infusion': {
        // Удаляем партию у получателя
        this.state.batches = this.state.batches.filter(b => b.id !== delta.receiverBatchId);

        // Возвращаем вычтенные объемы в исходные партии
        for (const ded of delta.batchDeductions) {
          const b = this.state.batches.find(x => x.id === ded.batchId);
          if (b) b.volume_мл += ded.volumeMl;
        }

        // Удаляем перемещение
        this.state.transfers = this.state.transfers.filter(t => t.id !== delta.transferId);
        break;
      }
      case 'create_batch': {
        // Удаляем созданную партию
        this.state.batches = this.state.batches.filter(b => b.id !== delta.batchId);

        // Возвращаем списанные ингредиенты
        for (const d of delta.deductions) {
          const item = this.state.inventory.find(i => i.id === d.itemId);
          if (item) item.quantity = d.oldQty;
        }
        break;
      }
      case 'adjust_stock': {
        const item = this.state.inventory.find(i => i.id === delta.itemId);
        if (item) item.quantity = delta.oldQty;
        break;
      }
      default:
        break;
    }

    // Удаляем операцию из журнала
    this.state.operationsLog = this.state.operationsLog.filter(o => o.id !== operationId);
    this.saveToStorage();
  }

  // --- Продажи и аналитика (Sales) ---
  public async getSales(period?: string, venueId?: string | null): Promise<Sale[]> {
    let list = this.state.sales;
    if (period) {
      list = list.filter(s => s.report_period === period);
    }
    if (venueId) {
      list = list.filter(s => s.venue_id === venueId);
    }
    return list;
  }

  public async insertSales(sales: Omit<Sale, 'id' | 'created_at'>[]): Promise<number> {
    const toInsert = sales.map(s => ({
      ...s,
      id: 'sl-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      created_at: new Date().toISOString()
    }));
    this.state.sales.push(...toInsert);
    this.saveToStorage();
    return toInsert.length;
  }

  public async getNameMappings(): Promise<NameMapping[]> {
    return this.state.nameMapping;
  }

  public async saveNameMapping(nameRaw: string, infusionId?: string | null, setId?: string | null): Promise<void> {
    const existing = this.state.nameMapping.find(m => m.name_raw.toLowerCase() === nameRaw.toLowerCase());
    if (existing) {
      existing.infusion_id = infusionId;
      existing.set_id = setId;
    } else {
      this.state.nameMapping.push({
        id: 'nm-' + Date.now(),
        name_raw: nameRaw,
        infusion_id: infusionId,
        set_id: setId
      });
    }
    this.saveToStorage();
  }

  // --- AI Ассистент (YandexGPT Lite) с Rate-limit 1 запрос / 3 сек ---
  public async callAiAssistant(message: string, currentVenueId?: string | null): Promise<{ reply: string; intent?: AIIntent }> {
    const now = Date.now();
    if (now - this.lastAiRequestTimestamp < 3000) {
      throw new Error('Лимит запросов к AI: не чаще 1 раза в 3 секунды. Пожалуйста, подождите.');
    }
    this.lastAiRequestTimestamp = now;

    // Сбор контекста для AI
    const stock = this.state.inventory.filter(i => !currentVenueId || i.venue_id === currentVenueId);
    const poorRatings = this.state.batches
      .filter(b => (b.rating === 1 || b.rating === 2) && b.notes)
      .map(b => {
        const inf = this.state.infusions.find(i => i.id === b.infusion_id);
        return {
          title: inf?.name || 'Неизвестно',
          rating: b.rating!,
          notes: b.notes!
        };
      });

    // 1. Попытка прямого вызова YandexGPT Lite через API-Key и Folder ID
    const yandexApiKey = import.meta.env.VITE_YANDEX_API_KEY;
    const yandexFolderId = import.meta.env.VITE_YANDEX_FOLDER_ID;

    if (yandexApiKey && yandexFolderId) {
      try {
        const yandexResp = await fetch('https://llm.api.cloud.yandex.net/foundationModels/v1/completion', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Api-Key ${yandexApiKey}`,
            'x-folder-id': yandexFolderId
          },
          body: JSON.stringify({
            modelUri: `gpt://${yandexFolderId}/yandexgpt-lite/latest`,
            completionOptions: {
              stream: false,
              temperature: 0.6,
              maxTokens: '1000'
            },
            messages: [
              {
                role: 'system',
                text: 'Ты старший бар-технолог и сомелье сети ресторанов «Мордовское подворье». Отвечай кратко, профессионально и по делу. Помогай с рецептами настоек, расходом сырья и витриной.'
              },
              {
                role: 'user',
                text: message
              }
            ]
          })
        });

        if (yandexResp.ok) {
          const resData = await yandexResp.json();
          const generatedText = resData.result?.alternatives?.[0]?.message?.text;
          if (generatedText) {
            // Анализируем локально намерение для создания карточки действия
            const localAction = this.fallbackLocalAiIntent(message, stock);
            return {
              reply: generatedText,
              intent: localAction.intent
            };
          }
        }
      } catch (e) {
        console.warn('YandexGPT direct call notice (using local AI fallback):', e);
      }
    }

    // Встроенный интеллектуальный локальный анализатор намерений (Local AI Fallback)
    return this.fallbackLocalAiIntent(message, stock);
  }

  public async generateAiMonthlyReport(salesSummary: any): Promise<string> {
    const now = Date.now();
    if (now - this.lastAiRequestTimestamp < 3000) {
      await new Promise(r => setTimeout(r, 3000));
    }
    this.lastAiRequestTimestamp = Date.now();

    // Локальная генерация отчёта строго по цифрам
    const margin = salesSummary.totalRevenue - salesSummary.totalCost;
    const marginPct = salesSummary.totalRevenue > 0 ? ((margin / salesSummary.totalRevenue) * 100).toFixed(1) : '0';

    return `📊 **Аналитический отчёт шеф-бармена за ${salesSummary.period || 'отчетный период'}**:

1. **Финансовые итоги сети**:
   - Выручка сети: **${salesSummary.totalRevenue.toLocaleString('ru-RU')} ₽**
   - Себестоимость: **${salesSummary.totalCost.toLocaleString('ru-RU')} ₽**
   - Валовая маржа: **${margin.toLocaleString('ru-RU')} ₽** (рентабельность ~${marginPct}%)
   - Всего реализовано: **${salesSummary.totalPortions} порций**

2. **Лидеры продаж**:
   - Топ-настойка по сети: **${salesSummary.topInfusion || 'нет данных'}**
   - Топ-сет: **${salesSummary.topSet || 'нет данных'}**

3. **Рекомендации по производству**:
   - Обеспечить неснижаемый запас основы для лидера продаж («${salesSummary.topInfusion}»).
   - Проверить наличие ягод и спирта на производстве «Подворье - Бар» к предстоящим выходным.`;
  }

  /**
   * Локальный детерминированный разборщик фраз для мгновенного ответа
   */
  private fallbackLocalAiIntent(msg: string, stock: InventoryItem[]): { reply: string; intent: AIIntent } {
    const lower = msg.toLowerCase();
    // 0. Запрос создания / генерации карточки для витрины настоек
    if (lower.includes('витрин') || lower.includes('придумай настойку') || lower.includes('новую настойку') || lower.includes('создай настойку') || lower.includes('сгенерируй настойку') || lower.includes('карточку')) {
      let nameCandidate = 'Таёжная на кедровых орешках';
      let emoji = '🌲';
      let category: ShowcaseItem['category'] = 'пряная';
      let descr = ['кедровый орех', 'таёжная смола', 'душистый перец', 'мёд'];

      if (lower.includes('брусник')) {
        nameCandidate = 'Брусничная с можжевельником';
        emoji = '🔴';
        category = 'ягодная';
        descr = ['дикая брусника', 'можжевельник', 'хвоя', 'ягодный танин'];
      } else if (lower.includes('груш') || lower.includes('дюшес')) {
        nameCandidate = 'Пряная томленая груша';
        emoji = '🍐';
        category = 'десертная';
        descr = ['садовая груша', 'бадьян', 'ваниль', 'карамель'];
      } else if (lower.includes('апельсин') || lower.includes('грейпфрут')) {
        nameCandidate = 'Красный грейпфрут с розмарином';
        emoji = '🍊';
        category = 'цитрусовая';
        descr = ['рубиновый грейпфрут', 'свежий розмарин', 'горьковатая цедра', 'цитрусовые эфиры'];
      } else if (lower.includes('перец') || lower.includes('чили') || lower.includes('чеснок')) {
        nameCandidate = 'Мордовская перцовка с копченым чесноком';
        emoji = '🌶️';
        category = 'гастрономическая';
        descr = ['острый чили', 'копченый чеснок', 'липовый мёд', 'паприка'];
      }

      const randomAbv = Math.floor(Math.random() * (32 - 28 + 1)) + 28;
      const agingOptions = ['14 дней', '21 день', 'более месяца'];
      const randomAging = agingOptions[Math.floor(Math.random() * agingOptions.length)];

      const generatedStory = 'Приготовлена в духе самобытных традиций мордовского застолья. Отборные натуральные ингредиенты проходят бережную холодную мацерацию, раскрывая насыщенную палитру вкуса. Настойка обладает благородной бархатистой текстурой, сбалансированной пикантностью и долгим согревающим шлейфом.';

      const showcaseItem: Omit<ShowcaseItem, 'id'> = {
        title: nameCandidate,
        title_en: 'Craft Infusion',
        emoji,
        abv: randomAbv,
        aging_text: randomAging,
        category,
        storytelling: generatedStory,
        food_pairing: 'Мясные деликатесы, дичь или традиционные горячие закуски',
        flavor_profile: {
          sweetness: Math.floor(Math.random() * 4) + 1,
          acidity: Math.floor(Math.random() * 4) + 1,
          spice: Math.floor(Math.random() * 4) + 1,
          density: Math.floor(Math.random() * 3) + 2,
          descriptors: descr
        }
      };

      return {
        reply: `Сгенерировал авторскую настойку для витрины: **«${showcaseItem.title}»** (категория: ${showcaseItem.category}, крепость: ${showcaseItem.abv}%, выдержка: ${showcaseItem.aging_text}).\n\n**Легенда:** «${showcaseItem.storytelling}»\n\nНажмите кнопку ниже, чтобы добавить карточку на гостевую витрину.`,
        intent: {
          action: 'showcase_create',
          showcase_item: showcaseItem
        }
      };
    }


    // 1. Запрос рекомендаций: «Что можно настоять?»
    if (lower.includes('что можно настоять') || lower.includes('предложи настойку') || lower.includes('рецепт')) {
      const availableItems = stock.filter(s => s.quantity > 0).map(s => s.name.toLowerCase());
      const suitableRecipes = this.state.recipes.filter(r =>
        r.ingredients.some(ing => availableItems.includes(ing.name.toLowerCase()))
      );

      if (suitableRecipes.length > 0) {
        const rec = suitableRecipes[0];
        return {
          reply: `Из имеющегося на складе сырья рекомендую поставить **«${rec.title}»** (${rec.category}, выдержка ${rec.days} дн., крепость ${rec.target_abv}%). Ингредиенты есть в наличии.`,
          intent: {
            action: 'recipe_suggest',
            suggested_recipe_id: rec.id
          }
        };
      }
    }

    // 2. Распознавание залива: «взяли 300 г смородины, долили 2 л спирта» / «поставить 5 л томатов»
    const litMatch = lower.match(/(\d+([.,]\d+)?)\s*(л|литр)/i);
    const volumeLiters = litMatch ? parseFloat(litMatch[1].replace(',', '.')) : 2;

    if (lower.includes('томат') || lower.includes('смородин') || lower.includes('хрен') || lower.includes('клюкв') || lower.includes('залили') || lower.includes('поставили')) {
      let matchedRecipe = this.state.recipes.find(r => {
        if (lower.includes('томат') && r.title.toLowerCase().includes('томат')) return true;
        if (lower.includes('смородин') && r.title.toLowerCase().includes('смородин')) return true;
        if (lower.includes('хрен') && r.title.toLowerCase().includes('хрен')) return true;
        if (lower.includes('клюкв') && r.title.toLowerCase().includes('клюкв')) return true;
        return false;
      }) || this.state.recipes[0];

      return {
        reply: `Распознал намерение залить партию **«${matchedRecipe.title}»** на **${volumeLiters} л**. Подтвердите операцию для автоматического списания сырья со склада.`,
        intent: {
          action: 'batch_create',
          suggested_recipe_id: matchedRecipe.id,
          volume_liters: volumeLiters
        }
      };
    }

    // 3. Распознавание перемещения: «отправь в Самовар / Еву»
    if (lower.includes('отправ') || lower.includes('перемест') || lower.includes('самовар') || lower.includes('еву') || lower.includes('подворье')) {
      let targetVenue = this.state.venues.find(v => lower.includes(v.name.toLowerCase())) || this.state.venues[1];
      return {
        reply: `Распознал перемещение в заведение **«${targetVenue.name}»**. Подтвердите отправку.`,
        intent: {
          action: 'transfer_item',
          target_venue: targetVenue.id
        }
      };
    }

    // Ответ по умолчанию с возвратом к теме
    return {
      reply: `Приветствую! Я бар-технолог сети «Мордовское подворье». Могу помочь рассчитать партию настойки, переместить продукцию в «Самовар», «Еву» или составить сводку продаж. Чем займемся?`,
      intent: { action: 'none' }
    };
  }
}

export const dataService = new DataService();
