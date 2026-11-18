// EmVB editor bundle wrapper. Importing the daisyUI provider here (a side-effect import) registers
// its component + recipe singleton in the BROWSER editor, so its elements show in the Add panel.
// Then re-export EmVB's real admin so the plugin's pages/fields/widgets still load.
// Wired via emvb({ adminEntry: "/src/emvb-admin.ts", providers: ["@perkyzz/emvb-daisyui"] }).
import "@perkyzz/emvb-daisyui";

export * from "@perkyzz/emvb/admin";
