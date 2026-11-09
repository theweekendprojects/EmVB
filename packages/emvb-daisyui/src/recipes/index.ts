import type { DaisyComponentNode, DaisyProps } from "../types.ts";

export type DaisyRecipeId =
  | "pricing"
  | "faq"
  | "login"
  | "signup"
  | "contact"
  | "product-grid"
  | "blog-grid"
  | "team-grid"
  | "dashboard-stats"
  | "navigation-shell";

export interface DaisyRecipe {
  id: DaisyRecipeId;
  name: string;
  description: string;
  category: "Marketing" | "Forms" | "Content" | "Application" | "Navigation";
  create: (id: () => string) => DaisyComponentNode[];
}

// A recipe builds nodes from a provider's createNode, injected at build time so this module does
// not import the provider singleton (that would make provider.ts <-> recipes/index.ts a cycle).
export type CreateNode = (component: string, id: string) => DaisyComponentNode;
let createNodeImpl: CreateNode = () => {
  throw new Error("daisyUI recipes used before the provider was built");
};
export const setRecipeCreateNode = (fn: CreateNode): void => {
  createNodeImpl = fn;
};

const node = (
  component: string,
  id: () => string,
  props: DaisyProps = {},
  children: DaisyComponentNode[] = [],
): DaisyComponentNode => {
  const created = createNodeImpl(component, id());
  return { ...created, props: { ...created.props, ...props }, ...(children.length ? { children } : {}) };
};

const cards = (id: () => string, labels: string[], tone = "primary") =>
  labels.map((label) => node("card", id, { title: label, body: `${label} content` }, [node("button", id, { label: "Learn more", tone })]));

export const DAISY_RECIPES: readonly DaisyRecipe[] = [
  { id: "pricing", name: "Pricing section", description: "Three plan cards with calls to action.", category: "Marketing", create: (id) => cards(id, ["Starter", "Pro", "Enterprise"]) },
  { id: "faq", name: "FAQ section", description: "Accessible question and answer accordions.", category: "Content", create: (id) => [node("accordion", id, {}, [node("collapse", id, { title: "How does it work?", content: "Choose a plan and publish." }), node("collapse", id, { title: "Can I cancel?", content: "Yes, at any time." })])] },
  { id: "login", name: "Login form", description: "Email, password and sign-in action.", category: "Forms", create: (id) => [node("card", id, { title: "Sign in" }, [node("input", id, { label: "Email", type: "email" }), node("input", id, { label: "Password", type: "password" }), node("button", id, { label: "Sign in", tone: "primary" })])] },
  { id: "signup", name: "Signup form", description: "Name, email, password and account action.", category: "Forms", create: (id) => [node("card", id, { title: "Create account" }, [node("input", id, { label: "Name" }), node("input", id, { label: "Email", type: "email" }), node("input", id, { label: "Password", type: "password" }), node("button", id, { label: "Create account", tone: "primary" })])] },
  { id: "contact", name: "Contact form", description: "Contact details, message and submit action.", category: "Forms", create: (id) => [node("card", id, { title: "Contact us" }, [node("input", id, { label: "Email", type: "email" }), node("textarea", id, { label: "Message" }), node("button", id, { label: "Send message", tone: "primary" })])] },
  { id: "product-grid", name: "Product cards", description: "Three product cards with purchase actions.", category: "Marketing", create: (id) => cards(id, ["Product one", "Product two", "Product three"], "secondary") },
  { id: "blog-grid", name: "Blog grid", description: "Three article preview cards.", category: "Content", create: (id) => cards(id, ["Latest news", "How-to guide", "Customer story"]) },
  { id: "team-grid", name: "Team grid", description: "Avatar cards for a compact team section.", category: "Content", create: (id) => ["Alex", "Sam", "Morgan"].map((name) => node("card", id, { title: name, body: "Team member" }, [node("avatar", id, { alt: name })])) },
  { id: "dashboard-stats", name: "Dashboard statistics", description: "Operational status and headline metrics.", category: "Application", create: (id) => [node("stats", id, { title: "Revenue", value: "€124k" }), node("stats", id, { title: "Orders", value: "1,284" }), node("stats", id, { title: "Conversion", value: "4.8%" })] },
  { id: "navigation-shell", name: "Navigation shell", description: "Navbar, menu and footer shell.", category: "Navigation", create: (id) => [node("navbar", id, { brand: "Brand" }, [node("menu", id, { items: "Home,Products,About" })]), node("footer", id, {})] },
] as const;

export const recipeById = (id: string): DaisyRecipe | undefined => DAISY_RECIPES.find((recipe) => recipe.id === id);

export function createRecipe(id: DaisyRecipeId, idFactory: () => string): DaisyComponentNode[] {
  const recipe = recipeById(id);
  if (!recipe) throw new Error(`Unknown daisyUI recipe: ${id}`);
  return recipe.create(idFactory);
}
