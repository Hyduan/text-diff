import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

async function enterTexts(page: Page, left: string, right: string) {
  await page.getByRole("textbox", { name: "原始文本", exact: true }).fill(left);
  await page
    .getByRole("textbox", { name: "修改后文本", exact: true })
    .fill(right);
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("starts with accessible empty editors and no stale StrictMode instances", async ({
  page,
}) => {
  await expect(page.getByRole("textbox")).toHaveCount(2);
  await expect(page.getByRole("status")).toHaveText("输入文本开始对比");
  await expect(
    page.getByRole("button", { name: "下一处差异", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "清空", exact: true }),
  ).toBeDisabled();
});

test("highlights exact Chinese characters and clears differences when texts match", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await enterTexts(page, "今天天气很好", "今天天气真好");
  await expect(page.locator(".cm-exactDeleted")).toHaveText("很");
  await expect(page.locator(".cm-exactInserted")).toHaveText("真");
  await expect(page.getByRole("status")).toContainText("1 处差异");
  await enterTexts(page, "今天天气很好", "今天天气很好");
  await expect(page.getByRole("status")).toHaveText("两侧文本一致");
  await expect(page.locator(".cm-exactDeleted, .cm-exactInserted")).toHaveCount(
    0,
  );
  expect(errors).toEqual([]);
});

test("supports swapping, clearing, and undo without losing text", async ({
  page,
}) => {
  await enterTexts(page, "原文😀", "修改后内容");
  await page.getByRole("button", { name: "交换", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "原始文本", exact: true }),
  ).toHaveText("修改后内容");
  await expect(
    page.getByRole("textbox", { name: "修改后文本", exact: true }),
  ).toHaveText("原文😀");
  await page.getByRole("button", { name: "清空", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("输入文本开始对比");
  const left = page.getByRole("textbox", { name: "原始文本", exact: true });
  await left.click();
  await left.press(process.platform === "darwin" ? "Meta+z" : "Control+z");
  await expect(left).toHaveText("修改后内容");
});

test("loads a sample and wraps navigation forward and backward", async ({
  page,
}) => {
  await page.getByRole("button", { name: "试试示例", exact: true }).click();
  const status = page.getByRole("status");
  await expect(status).toContainText("3 处差异");
  await expect(status).toContainText("新增 1");
  await expect(status).toContainText("删除 1");
  await expect(status).toContainText("修改 1");
  await expect(
    page.getByRole("button", { name: "试试示例", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "下一处差异", exact: true }).click();
  await expect(page.getByRole("group", { name: "对比操作" })).toContainText(
    "1 / 3",
  );
  await page.getByRole("button", { name: "上一处差异", exact: true }).click();
  await expect(page.getByRole("group", { name: "对比操作" })).toContainText(
    "3 / 3",
  );
  await page
    .getByRole("textbox", { name: "修改后文本", exact: true })
    .press("F7");
  await expect(page.getByRole("group", { name: "对比操作" })).toContainText(
    "1 / 3",
  );
});

test("uses one vertical scroller and aligns unchanged lines after insertions", async ({
  page,
}) => {
  const rows = Array.from({ length: 120 }, (_, i) => `共同内容第 ${i + 1} 行`);
  const left = rows.join("\n");
  const right = [
    ...rows.slice(0, 8),
    ...Array.from({ length: 12 }, (_, i) => `新增内容 ${i}`),
    ...rows.slice(8),
  ].join("\n");
  await enterTexts(page, left, right);
  await expect(page.getByRole("status")).toContainText("新增 1");
  await page.locator(".cm-mergeView").evaluate((node) => {
    if (node instanceof HTMLElement) node.scrollTop = 500;
  });
  await expect
    .poll(async () =>
      page
        .locator(".cm-mergeView")
        .evaluate((node) => (node instanceof HTMLElement ? node.scrollTop : 0)),
    )
    .toBeGreaterThan(0);
  await expect
    .poll(async () => {
      const a = await page
        .locator(".cm-merge-a .cm-line")
        .filter({ hasText: /^共同内容第 20 行$/ })
        .boundingBox();
      const b = await page
        .locator(".cm-merge-b .cm-line")
        .filter({ hasText: /^共同内容第 20 行$/ })
        .boundingBox();
      return a && b ? Math.abs(a.y - b.y) : 100;
    })
    .toBeLessThan(2);
});

test("keeps controls and editors within the minimum desktop window", async ({
  page,
}) => {
  await page.setViewportSize({ width: 640, height: 520 });
  await expect(page.getByRole("textbox")).toHaveCount(2);
  const dimensions = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    height: document.documentElement.scrollHeight,
    viewportHeight: innerHeight,
  }));
  expect(dimensions.width).toBeLessThanOrEqual(640);
  expect(dimensions.height).toBeLessThanOrEqual(dimensions.viewportHeight);
  await expect(
    page.getByRole("button", { name: "下一处差异", exact: true }),
  ).toBeInViewport();
});

for (const [side, label] of [
  ["a", "原始文本"],
  ["b", "修改后文本"],
] as const) {
  test(`keeps unchanged rows aligned when the ${side} search panel opens and closes`, async ({
    page,
  }) => {
    const text = "共同第一行\n共同第二行\n共同第三行";
    await enterTexts(page, text, text);
    const alignment = async () => {
      const left = await page
        .locator(".cm-merge-a .cm-line")
        .filter({ hasText: /^共同第一行$/ })
        .boundingBox();
      const right = await page
        .locator(".cm-merge-b .cm-line")
        .filter({ hasText: /^共同第一行$/ })
        .boundingBox();
      return left && right ? Math.abs(left.y - right.y) : Infinity;
    };
    await expect.poll(alignment).toBeLessThan(2);
    const editor = page.getByRole("textbox", { name: label, exact: true });
    await editor.click();
    await editor.press(process.platform === "darwin" ? "Meta+f" : "Control+f");
    const searchPanel = page.locator(`.cm-merge-${side} .cm-search`);
    await expect(searchPanel).toBeVisible();
    await expect.poll(alignment).toBeLessThan(2);
    await searchPanel
      .getByRole("button", { name: "关闭", exact: true })
      .click();
    await expect(searchPanel).toHaveCount(0);
    await expect.poll(alignment).toBeLessThan(2);
  });
}

test("keeps the coarse comparison warning visible in the minimum window", async ({
  page,
}) => {
  await page.setViewportSize({ width: 640, height: 520 });
  await enterTexts(page, "甲".repeat(15_000), "乙".repeat(15_000));
  const warning = page.getByText("复杂差异已按整段标记", { exact: true });
  await expect(warning).toBeVisible();
  await expect(warning).toBeInViewport();
  await expect(warning).toHaveAttribute("aria-live", "polite");
  const dimensions = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    height: document.documentElement.scrollHeight,
  }));
  expect(dimensions.width).toBeLessThanOrEqual(640);
  expect(dimensions.height).toBeLessThanOrEqual(520);
  await page.getByRole("button", { name: "清空", exact: true }).click();
  await expect(warning).toHaveCount(0);
  await expect(page.getByRole("status")).toHaveText("输入文本开始对比");
});
