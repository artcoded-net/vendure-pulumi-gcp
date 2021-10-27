import { LanguageCode, CustomFields } from "@vendure/core";

export const ProductCustomFields: CustomFields["Product"] = [
  {
    name: "subtitle",
    type: "string",
    label: [
      { languageCode: LanguageCode.en, value: "Subtitle" },
      { languageCode: LanguageCode.it, value: "Sottotitolo" },
    ],
  },
];

export const VariantCustomFields: CustomFields["ProductVariant"] = [
  {
    name: "fullPrice",
    type: "float",
    label: [
      { languageCode: LanguageCode.en, value: "Full price" },
      { languageCode: LanguageCode.it, value: "Prezzo pieno" },
    ],
    description: [
      {
        languageCode: LanguageCode.en,
        value:
          "Set this as a variant full price if you want the actual selling price to be shown as a discounted one",
      },
      {
        languageCode: LanguageCode.it,
        value:
          "Imposta questo prezzo pieno per la variante, se vuoi che il prezzo di vendita sia mostrato come scontato",
      },
    ],
  },
];
