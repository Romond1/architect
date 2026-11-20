import { useState } from 'react';
import { Check, Coins, Sparkles } from 'lucide-react';
import {
  evaluateShopPurchase,
  isShopItemEquipped,
  listShopCatalog,
} from '../framework/rewards/shopService';
import type { FrameworkState, ShopItemCategory } from '../framework/types';
import styles from './GalleryView.module.css';
import { MrRabbitPortrait } from './MrRabbitPortrait';
import { ShopItemArtwork } from './ShopItemArtwork';

interface RewardShopViewProps {
  state: FrameworkState;
  equippedItemIds: string[];
  onBuyItem: (itemId: string) => void;
  onEquipItem: (itemId: string) => void;
  onUnequipItem: (itemId: string) => void;
}

type FilterOption = 'all' | ShopItemCategory;

const FILTER_LABELS: Array<{ id: FilterOption; label: string }> = [
  { id: 'all', label: 'All Cosmetics' },
  { id: 'customer_accessory', label: 'Mr. Rabbit Attire' },
  { id: 'studio_decor', label: 'Studio Decor' },
  { id: 'studio_trophy', label: 'Trophies' },
  { id: 'studio_theme', label: 'Studio Themes' },
];

export function RewardShopView({
  state,
  equippedItemIds,
  onBuyItem,
  onEquipItem,
  onUnequipItem,
}: RewardShopViewProps) {
  const [filter, setFilter] = useState<FilterOption>('all');
  const catalog = listShopCatalog();
  const visibleItems =
    filter === 'all'
      ? catalog
      : catalog.filter((item) => item.category === filter);

  return (
    <div className={styles.pageWrap} data-testid="reward-shop-view">
      <div className={styles.heroCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <MrRabbitPortrait
            expression={equippedItemIds.length > 0 ? 'impressed' : 'greeting'}
            equippedItemIds={equippedItemIds}
            reducedMotion={state.preferences.reducedMotion}
            size="sm"
          />
          <div>
            <h2 className={styles.heroTitle}>Studio Reward Shop</h2>
            <p className={styles.heroSub}>
              Spend your personal commission earnings on special studio themes,
              desk trophies, and dapper outfits for Mr. Rabbit. All architectural
              learning features are always free!
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '9px',
            padding: '10px 16px',
            borderRadius: 'var(--radius-pill)',
            background: 'var(--accent-gold-soft)',
            border: '1.5px solid var(--accent-gold-border)',
          }}
          data-testid="shop-wallet-balance"
        >
          <Coins size={20} color="var(--accent-gold)" />
          <div>
            <div style={{ fontSize: '0.84rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-gold-bright)' }}>
              Personal Wallet
            </div>
            <strong style={{ fontSize: '1.18rem' }}>
              {state.wallet.balance.toLocaleString()} coins
            </strong>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className={styles.filterRow}>
        {FILTER_LABELS.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`${styles.filterChip} ${
              filter === option.id ? styles.filterChipActive : ''
            }`}
            onClick={() => setFilter(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className={styles.grid}>
        {visibleItems.map((item) => {
          const isOwned = state.inventory.ownedItemIds.includes(item.id);
          const isEquipped = isShopItemEquipped(state.inventory, item.id);
          const purchaseCheck = evaluateShopPurchase(state, item.id);

          return (
            <article
              key={item.id}
              className={`${styles.card} ${isEquipped ? styles.cardHighlighted : ''}`}
              data-testid={`shop-item-${item.id}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <ShopItemArtwork itemId={item.id} size={86} />
                <div style={{ flex: 1 }}>
                  <div className={styles.badgeRow}>
                    <span className={`${styles.badge} ${styles.badgeGold}`}>
                      {item.price.toLocaleString()} coins
                    </span>
                    {isOwned && (
                      <span className={`${styles.badge} ${styles.badgeSage}`}>
                        Owned
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: '1.2rem', marginTop: '7px' }}>
                    {item.name}
                  </h3>
                </div>
              </div>

              <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.58 }}>
                {item.description}
              </p>

              <div
                style={{
                  fontSize: '0.9rem',
                  lineHeight: 1.45,
                  color: 'var(--accent-blueprint)',
                  background: 'var(--accent-blueprint-soft)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <Sparkles size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                {item.previewEffect}
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '4px' }}>
                {isOwned ? (
                  isEquipped ? (
                    <button
                      type="button"
                      className={styles.secondaryBtn}
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={() => onUnequipItem(item.id)}
                      data-testid={`unequip-item-${item.id}`}
                    >
                      <Check size={16} />
                      <span>Equipped (Click to Unequip)</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={styles.primaryBtn}
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={() => onEquipItem(item.id)}
                      data-testid={`equip-item-${item.id}`}
                    >
                      <Sparkles size={16} />
                      <span>Equip</span>
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    className={styles.primaryBtn}
                    style={{ width: '100%', justifyContent: 'center' }}
                    disabled={!purchaseCheck.canBuy}
                    onClick={() => onBuyItem(item.id)}
                    title={purchaseCheck.reason}
                    data-testid={`buy-item-${item.id}`}
                  >
                    <Coins size={16} />
                    <span>
                      {purchaseCheck.canBuy
                        ? `Buy for ${item.price} coins`
                        : purchaseCheck.reason}
                    </span>
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
