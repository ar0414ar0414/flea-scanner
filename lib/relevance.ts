// ヤフオクの曖昧一致で混入する無関係商品を、タイトルとキーワードの一致度で除去
export function filterByRelevance<T extends { title: string }>(
  items: T[],
  keyword: string,
): T[] {
  const tokens = keyword.normalize("NFKC").toLowerCase().split(/\s+/).filter((t) => t.length >= 2);
  if (tokens.length === 0) return items;
  const scored = items.filter((i) => {
    const title = i.title.normalize("NFKC").toLowerCase();
    const matched = tokens.filter((t) => title.includes(t)).length;
    return matched / tokens.length >= 0.5;
  });
  // 一致品が1件もない場合のみ元のリストを使う（Yahoo側の関連結果）
  return scored.length > 0 ? scored : items;
}
