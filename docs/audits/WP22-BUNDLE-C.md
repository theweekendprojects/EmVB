# Bundle C: WP22 complete compound editing

Menu, Tabs, Accordion, Table and Carousel now use typed provider children. The editor supports add, label editing, Menu URLs, selected Tab, initial Accordion state, duplicate, delete, move buttons and drag reorder. Rich-content items keep normal EmVB child nodes and remain editable through Layers. Table helpers create typed head/body/row/cell structures and keep column counts aligned. Validation rejects wrong parts, duplicate item IDs, invalid Tab selection and empty rows. Legacy line-based Menu, Tabs, Accordion and Carousel data migrates deterministically and only once.

All mutations flow through the existing `onChange` editor path, so EmVB history, undo/redo, save and reload remain centralized rather than duplicated in the provider editor.
