import type { DaisyComponentNode, DaisyProps } from "../types.ts";
import { targetIn } from "../catalog/countdown.ts";

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
  | "navigation-shell"
  | "countdown-launch"
  | "countdown-sale"
  | "countdown-event"
  | "countdown-flash"
  | "countdown-earlybird"
  | "section-hero"
  | "section-features"
  | "section-cta"
  | "section-reviews"
  | "section-numbers"
  | "section-footer";

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
  return {
    ...created,
    props: { ...created.props, ...props },
    ...(children.length ? { children } : {}),
  };
};

const cards = (id: () => string, labels: string[], tone = "primary") =>
  labels.map((label) =>
    node("card", id, { title: label, body: `${label} content` }, [
      node("button", id, { label: "Learn more", tone }),
    ]),
  );

export const DAISY_RECIPES: readonly DaisyRecipe[] = [
  // Sections for site owners: plain placeholder words to replace with their own. Listed first.
  {
    id: "section-hero",
    name: "daisyUI Hero",
    description: "A large headline, a short message and one button. Replace the words with yours.",
    category: "Marketing",
    create: (id) => [
      node("hero", id, {
        title: "Your headline goes here",
        body: "Say in one or two sentences what you offer and who it is for.",
        action: "Get started",
        href: "#",
      }),
    ],
  },
  {
    id: "section-features",
    name: "daisyUI Features",
    description: "Three short boxes side by side that explain what you offer.",
    category: "Marketing",
    create: (id) => [
      node("columns", id, { columns: "3" }, [
        node("card", id, { title: "Easy to use", body: "Describe this benefit in one sentence." }),
        node("card", id, { title: "Works everywhere", body: "Describe this benefit in one sentence." }),
        node("card", id, { title: "Built to last", body: "Describe this benefit in one sentence." }),
      ]),
    ],
  },
  {
    id: "section-cta",
    name: "daisyUI Call to action",
    description: "A band that asks the visitor to take one step, with a button.",
    category: "Marketing",
    create: (id) => [
      node("card", id, { title: "Ready to start?", body: "Take the next step in one click.", align: "start" }, [
        node("button", id, { label: "Contact us", tone: "primary" }),
      ]),
    ],
  },
  {
    id: "section-reviews",
    name: "daisyUI Customer reviews",
    description: "Three short quotes from customers, side by side. Replace the names and words.",
    category: "Marketing",
    create: (id) => [
      node("columns", id, { columns: "3" },
        ["Customer name", "Customer name", "Customer name"].map((name) =>
          node("card", id, { title: name, body: "Put a short quote from a happy customer here." }),
        ),
      ),
    ],
  },
  {
    id: "section-numbers",
    name: "daisyUI Key numbers",
    description: "Three numbers that show your results. Replace them with real figures.",
    category: "Marketing",
    create: (id) => [
      node("columns", id, { columns: "3" }, [
        node("stats", id, { title: "Customers", value: "1,200", description: "Served so far" }),
        node("stats", id, { title: "Projects", value: "340", description: "Completed" }),
        node("stats", id, { title: "Rating", value: "4.9", description: "Average review" }),
      ]),
    ],
  },
  {
    id: "section-footer",
    name: "daisyUI Footer",
    description: "Your name, a short line and links to the main pages, centred.",
    category: "Navigation",
    create: (id) => [
      node("footer", id, {
        brand: "Your business name",
        description: "A short line about what you do.",
        links: "About|/about\nContact|/contact\nPrivacy|/privacy",
        layout: "vertical",
      }),
    ],
  },
  {
    id: "pricing",
    name: "Pricing section",
    description: "Three plan cards with calls to action.",
    category: "Marketing",
    create: (id) => cards(id, ["Starter", "Pro", "Enterprise"]),
  },
  {
    id: "faq",
    name: "FAQ section",
    description: "Accessible question and answer accordions.",
    category: "Content",
    create: (id) => [
      node("accordion", id, {}, [
        { id: id(), type: "provider", provider: "daisyui", component: "accordion-item", props: { label: "How does it work?" }, children: [node("card", id, { body: "Choose a plan and publish." })] },
        { id: id(), type: "provider", provider: "daisyui", component: "accordion-item", props: { label: "Can I cancel?" }, children: [node("card", id, { body: "Yes, at any time." })] },
      ]),
    ],
  },
  {
    id: "login",
    name: "Login form",
    description: "Email, password and sign-in action.",
    category: "Forms",
    create: (id) => [
      node("card", id, { title: "Sign in" }, [
        node("input", id, { label: "Email", type: "email" }),
        node("input", id, { label: "Password", type: "password" }),
        node("button", id, { label: "Sign in", tone: "primary" }),
      ]),
    ],
  },
  {
    id: "signup",
    name: "Signup form",
    description: "Name, email, password and account action.",
    category: "Forms",
    create: (id) => [
      node("card", id, { title: "Create account" }, [
        node("input", id, { label: "Name" }),
        node("input", id, { label: "Email", type: "email" }),
        node("input", id, { label: "Password", type: "password" }),
        node("button", id, { label: "Create account", tone: "primary" }),
      ]),
    ],
  },
  {
    id: "contact",
    name: "Contact form",
    description: "Contact details, message and submit action.",
    category: "Forms",
    create: (id) => [
      node("card", id, { title: "Contact us" }, [
        node("input", id, { label: "Email", type: "email" }),
        node("textarea", id, { label: "Message" }),
        node("button", id, { label: "Send message", tone: "primary" }),
      ]),
    ],
  },
  {
    id: "product-grid",
    name: "Product cards",
    description: "Three product cards with purchase actions.",
    category: "Marketing",
    create: (id) => cards(id, ["Product one", "Product two", "Product three"], "secondary"),
  },
  {
    id: "blog-grid",
    name: "Blog grid",
    description: "Three article preview cards.",
    category: "Content",
    create: (id) => cards(id, ["Latest news", "How-to guide", "Customer story"]),
  },
  {
    id: "team-grid",
    name: "Team grid",
    description: "Avatar cards for a compact team section.",
    category: "Content",
    create: (id) =>
      ["Alex", "Sam", "Morgan"].map((name) =>
        node("card", id, { title: name, body: "Team member" }, [node("avatar", id, { alt: name })]),
      ),
  },
  {
    id: "dashboard-stats",
    name: "Dashboard statistics",
    description: "Operational status and headline metrics.",
    category: "Application",
    create: (id) => [
      node("stats", id, { title: "Revenue", value: "€124k" }),
      node("stats", id, { title: "Orders", value: "1,284" }),
      node("stats", id, { title: "Conversion", value: "4.8%" }),
    ],
  },
  {
    id: "navigation-shell",
    name: "Navigation shell",
    description: "Navbar, menu and footer shell.",
    category: "Navigation",
    create: (id) => [
      node("navbar", id, { brand: "Brand" }, [node("menu", id, { items: "Home,Products,About" })]),
      node("footer", id, {}),
    ],
  },
  {
    id: "countdown-launch",
    name: "Launch countdown",
    description: "Big boxed countdown to a launch, with a notify button.",
    category: "Marketing",
    create: (id) => [
      node("card", id, { title: "We launch soon", body: "Be first in line when we go live.", size: "lg" }, [
        node("countdown", id, {
          target: targetIn(14, 9, true),
          zone: "UTC",
          layout: "boxes",
          units: "dhms",
          size: "lg",
          expired: "We are live!",
        }),
        node("button", id, { label: "Notify me", tone: "primary" }),
      ]),
    ],
  },
  {
    id: "countdown-sale",
    name: "Sale ends countdown",
    description: "Plain countdown to the end of a sale, on each visitor's own clock.",
    category: "Marketing",
    create: (id) => [
      node("card", id, { title: "Summer sale", body: "Everything is 30% off until the timer ends.", size: "sm" }, [
        node("countdown", id, {
          target: targetIn(4, 0),
          zone: "viewer",
          layout: "plain",
          units: "dhms",
          size: "md",
          expired: "This sale has ended.",
        }),
        node("button", id, { label: "Shop now", tone: "primary" }),
      ]),
    ],
  },
  {
    id: "countdown-event",
    name: "Event starts in",
    description: "Days, hours and minutes to a fixed-time event, with a sign-up button.",
    category: "Marketing",
    create: (id) => [
      node("card", id, { title: "Live webinar", body: "Free live session with questions and answers.", size: "md" }, [
        node("countdown", id, {
          target: targetIn(10, 18, true),
          zone: "UTC",
          layout: "boxes",
          units: "dhm",
          size: "md",
          expired: "The event has started.",
        }),
        node("button", id, { label: "Reserve my seat", tone: "primary" }),
      ]),
    ],
  },
  {
    id: "countdown-flash",
    name: "Flash sale clock",
    description: "Hours, minutes and seconds as a clock, for a short sale.",
    category: "Marketing",
    create: (id) => [
      node("card", id, { title: "Flash sale", body: "Prices go back up when the clock runs out.", size: "sm" }, [
        node("countdown", id, {
          target: targetIn(2, 12),
          zone: "viewer",
          layout: "clock",
          units: "hms",
          size: "xl",
          expired: "Sale ended",
        }),
        node("button", id, { label: "Shop the sale", tone: "primary" }),
      ]),
    ],
  },
  {
    id: "countdown-earlybird",
    name: "Early-bird days left",
    description: "Just the days left until early-bird pricing ends.",
    category: "Marketing",
    create: (id) => [
      node("card", id, { title: "Early-bird pricing", body: "Lock in the lower price before the timer ends.", size: "sm" }, [
        node("countdown", id, {
          target: targetIn(21, 23),
          zone: "viewer",
          layout: "plain",
          units: "d",
          size: "lg",
          labels: "days left",
          expired: "Early-bird pricing has ended.",
        }),
        node("button", id, { label: "Get the early-bird price", tone: "primary" }),
      ]),
    ],
  },
] as const;

export const recipeById = (id: string): DaisyRecipe | undefined =>
  DAISY_RECIPES.find((recipe) => recipe.id === id);

export function createRecipe(id: DaisyRecipeId, idFactory: () => string): DaisyComponentNode[] {
  const recipe = recipeById(id);
  if (!recipe) throw new Error(`Unknown daisyUI recipe: ${id}`);
  return recipe.create(idFactory);
}
