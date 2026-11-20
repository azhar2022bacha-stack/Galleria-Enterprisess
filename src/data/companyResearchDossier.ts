// Supplied public-source research dossier, formatted for the About page.
export type DossierBlock =
  | { type: 'paragraph' | 'note' | 'heading'; text: string }
  | { type: 'list' | 'ordered'; items: string[] }
  | { type: 'table'; headers: [string, string]; rows: Array<[string, string]> };

export const companyResearchDossier: {
  location: string;
  researchDate: string;
  scope: string;
  sections: Array<{ title: string; blocks: DossierBlock[] }>;
} = {
  "location": "Fairfield, New Jersey, United States",
  "researchDate": "16 November 2026",
  "scope": "Publicly available company website, product and customer-care pages, trademark listings, and third-party import/shipping datasets. This report does not include private or paid-database information.",
  "sections": [
    {
      "title": "Executive summary",
      "blocks": [
        {
          "type": "paragraph",
          "text": "Galleria Enterprises, Inc. presents itself on its official website as a US wholesale supplier of fashion, accessories, gifts and weather-related products. Its public catalogue includes umbrellas, scarves, clothing, vests, quilted jackets, rainwear, rain boots, bags and related accessories. The website describes a wholesale ordering model, a $200 minimum order, per-style minimum quantities, and a New Jersey warehouse. Public third-party trade data also associates a Galleria Enterprises Inc. at Commerce Road, United States, with import shipments, particularly umbrellas, scarves and apparel/footwear-related goods. The data supports that import activity has been recorded under this consignee name, but it does not independently establish current financial health, legal standing, ownership, or trustworthiness."
        }
      ]
    },
    {
      "title": "Identity and contact information",
      "blocks": [
        {
          "type": "table",
          "headers": [
            "Field",
            "Publicly listed information"
          ],
          "rows": [
            [
              "Company name",
              "Galleria Enterprises, Inc."
            ],
            [
              "Address / stated headquarters and warehouse",
              "24 Commerce Road, Suite D, Fairfield, NJ 07004, USA"
            ],
            [
              "Telephone",
              "646-416-6683"
            ],
            [
              "Fax",
              "646-290-5754 (also formatted 646.290.5754)"
            ],
            [
              "Office hours stated on About page",
              "Monday–Friday, 9:00 a.m.–7:00 p.m.; Saturday and Sunday closed"
            ]
          ]
        },
        {
          "type": "paragraph",
          "text": "The website reviewed for the report labels this address as its “Corporate Headquarters / Warehouse.” Its About and Customer Care pages list the address and phone number."
        }
      ]
    },
    {
      "title": "Business model and products",
      "blocks": [
        {
          "type": "paragraph",
          "text": "The official website describes the business as wholesale. Its home page states that it is a wholesale ordering site, not a retail store. It promotes products for retailers or trade buyers, and says it may customize products not shown in the catalogue."
        },
        {
          "type": "heading",
          "text": "Product families shown on the website"
        },
        {
          "type": "list",
          "items": [
            "Umbrellas: stick and folding styles; reverse-close designs; single-cover and double-cover variants; themed designs including flowers, cityscapes, nature, animals and other artwork.",
            "Clothing: blouses, pants and other fashion apparel.",
            "Vests and outerwear: quilted vests, jackets and seasonal collections.",
            "Rainwear: raincoats and rain boots.",
            "Scarves and bags.",
            "Accessories and gift items: the About page also refers to scrunchies and sleeping masks.",
            "Displays and children's products are included in the website navigation/catalogue."
          ]
        },
        {
          "type": "paragraph",
          "text": "Examples of named umbrella designs displayed include Navy/Camel Stick Umbrella Reverse Close, Black/Red Stick Umbrella Reverse Close, Black/Red Folding Umbrella Reverse Close, Blue Morpho, Peacock, Cats and Dogs, and Stained Glass Dragonfly designs. Product availability and current pricing must be confirmed directly with the company."
        }
      ]
    },
    {
      "title": "Wholesale ordering and payment terms",
      "blocks": [
        {
          "type": "table",
          "headers": [
            "Term",
            "Website statement"
          ],
          "rows": [
            [
              "Minimum order total",
              "US $200 minimum order total."
            ],
            [
              "Minimum per style",
              "3 pieces each for umbrellas, scarves, bags, scrunchies and sleeping masks; 1 piece per style for all other items (as stated on the About page)."
            ],
            [
              "Payment methods",
              "American Express, Discover, MasterCard, Visa, checks, ACH and wire transfer."
            ],
            [
              "Credit terms",
              "If Net 30 terms are granted, payment must be by check."
            ]
          ]
        }
      ]
    },
    {
      "title": "Shipping, delivery and returns",
      "blocks": [
        {
          "type": "paragraph",
          "text": "The official Customer Care page states that products ship daily from the New Jersey warehouse. It gives a general delivery estimate of 1–5 days depending on destination. It says UPS Ground is the main shipping method; FedEx collect or third-party accounts can be accommodated. For other methods, including international shipments, customers are asked to call the company."
        },
        {
          "type": "paragraph",
          "text": "The same page says UPS tracking information is emailed when the company has the customer's email address. For a missing order, it directs customers to call 646-416-6683. For returns, it asks customers to call a representative and have their customer account number available. The page does not publish a detailed return window, restocking fee, refund timetable or full international returns procedure."
        }
      ]
    },
    {
      "title": "Import and supply-chain records",
      "blocks": [
        {
          "type": "paragraph",
          "text": "A Trademo company profile for “galleria enterprises inc” associates the name with 22 import shipments and identifies China as the top sourcing country. The profile reports imports of umbrellas, scarves and related items, and lists suppliers including Shanghai East Best Foreign Trading, Shenzhen Hongqing Umbrella Co. Ltd. and Hongguan Industrial Co. Ltd. The opened Trademo page contains an internal date-range inconsistency: its summary describes Jan 2022–Sept 2025, while visible shipment rows include Mar 6, 2026. It also reports estimated trade values and shipment totals. These should be treated as third-party database estimates and not as audited company accounts or complete customs records."
        },
        {
          "type": "paragraph",
          "text": "A separate ImportGenius shipment example records Galleria Enterprises, Inc. as importer/notify party at 24 Commerce Road, Suite D, Fairfield, NJ 07004, with Shenzhen Hongqing Umbrella Co., Ltd. as shipper. It shows an arrival date of March 27, 2024, origin Yantian, China, and destination port area Newark, New Jersey. This is one shipment example, not proof of the full supplier relationship or current sourcing arrangements."
        },
        {
          "type": "paragraph",
          "text": "The trade data reviewed records the company as a buyer/importer. The Trademo profile reports no exports in the dataset it presents. This does not prove that the company has never exported; it only describes that data provider's records."
        }
      ]
    },
    {
      "title": "Trademark / brand record",
      "blocks": [
        {
          "type": "paragraph",
          "text": "Public trademark listings identify a US trademark for “GALLERIA ENTERPRISES,” serial number 87937830 and registration number 5817357. The listings associate the mark with Galleria Enterprises, Inc. in Fairfield, NJ and describe the goods/services as retail gift shops. One third-party trademark listing reports registration on July 30, 2019; another reports a Section 8/15 acceptance/acknowledgment event on November 14, 2025. Confirm the current official record directly through the USPTO before relying on it for legal purposes."
        }
      ]
    },
    {
      "title": "What is not confirmed by the public material reviewed",
      "blocks": [
        {
          "type": "list",
          "items": [
            "Current New Jersey corporate standing, formation date, registered agent and official business ID were not verified directly in the state corporate registry during this research.",
            "Owners, shareholders, directors and officers were not reliably established.",
            "Audited revenue, profit, bank details, credit rating, debts and financial condition were not found in reliable public records.",
            "The exact number of employees is not verified. A commercial directory gives an approximate headcount, but this is not treated as authoritative.",
            "No independent conclusion can be made about customer satisfaction, product quality, complaint history or on-time delivery rates from the material reviewed.",
            "The company's current international export capability, wholesale pricing, distributor terms and willingness to supply any particular country must be confirmed directly.",
            "No evidence reviewed proves that an individual using the company name, logo, email display name or WhatsApp profile is genuinely employed or authorized by the company."
          ]
        }
      ]
    },
    {
      "title": "Due-diligence checklist before doing business",
      "blocks": [
        {
          "type": "ordered",
          "items": [
            "Contact the company using the phone number and email published on its official website—not only details supplied by a third party.",
            "Ask for a formal quotation on company letterhead showing legal name, address, item descriptions, quantities, unit prices, shipping terms, taxes/duties and payment instructions.",
            "Request a current W-9 (if you are a US business customer) or appropriate company registration/tax documentation, and independently verify the details.",
            "Check the current New Jersey entity record and obtain a certificate of good standing if the transaction is significant.",
            "Confirm that the beneficiary name on any bank account exactly matches the legal supplier name. Be cautious if asked to pay an unrelated person or company.",
            "Do not pay personal accounts, cryptocurrency wallets, gift cards or unexpected “registration/activation” fees without independently verified contractual grounds.",
            "For a first transaction, consider a small test order, a protected payment method, and written inspection/return terms.",
            "For international shipments, agree in writing who handles export documents, freight, insurance, customs clearance, duties, delivery and returns.",
            "Verify the identity and authority of the sales representative by calling the company's published main number and asking to be transferred or to have the quote confirmed."
          ]
        }
      ]
    },
    {
      "title": "Practical questions to send the company",
      "blocks": [
        {
          "type": "list",
          "items": [
            "Could you please confirm your current wholesale catalogue and price list?",
            "Do you accept international orders and ship to my country?",
            "What are the current minimum order quantity and minimum order value?",
            "Can you provide a pro forma invoice and your official company payment details?",
            "What are the shipping costs, delivery estimates, Incoterms (if applicable), and return/defect policies?",
            "Can you confirm the name and position of the sales representative handling my account?"
          ]
        }
      ]
    },
    {
      "title": "Sources and research links",
      "blocks": [
        {
          "type": "list",
          "items": [
            "Official website – Home / wholesale catalogue",
            "Official About Us – address, contact, ordering minimums and payment methods",
            "Official Customer Care – shipping, delivery and returns FAQ",
            "Official Essentials catalogue",
            "Official Umbrellas catalogue",
            "Official Vests catalogue",
            "Trademo – company import profile and trade data",
            "ImportGenius – supplier/shipment example",
            "Justia Trademarks – Galleria Enterprises mark listing",
            "NAICSList – commercial directory profile (unverified directory data)"
          ]
        },
        {
          "type": "heading",
          "text": "Research limitations and disclaimer"
        },
        {
          "type": "paragraph",
          "text": "Prepared from public web sources available on 16 November 2026. Information can change. Third-party databases may contain incomplete, duplicated, delayed or estimated records. This document is informational due diligence, not legal, tax, investment, credit or fraud-clearance advice. It does not certify that the company is active, solvent, safe to trade with, or that any person claiming association with it is authorized. For high-value transactions, obtain official state records and professional advice."
        }
      ]
    }
  ]
};
