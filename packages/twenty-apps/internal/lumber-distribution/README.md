# Lumber Distribution

A Twenty CRM app for arranging lumber shipments directly from suppliers to customers, with Florida field sales and product demonstrations. The name is a working label; business branding, products, regions and terms can change later. Monetary fields use USD in this first version.

This app extends Twenty rather than replacing its core. A running Twenty instance **2.58.0 or later** is required. The GitHub repository by itself is not a hosted CRM.

## Daily workspace

The sidebar follows the business process: **Overview → Customers & suppliers → Contacts → Products → Site visits → Quotes & orders → Shipments → Reorder plans → Commissions**, followed by **Tasks** and **Notes**.

Customers, prospects and suppliers are views of the same company directory. Enter a business once and set its role; a company can be both a customer and a supplier. Contacts are Twenty's existing People records. Planned visits, delayed shipments, active reorder plans and unconfirmed commission terms are saved views inside their respective sections, rather than additional sidebar sections.

Use **Quotes & orders** for the entire sale, starting with Draft or Quoted and moving to Confirmed after agreement. The base CRM's Opportunities section is kept as **Legacy opportunities** inside **Workspace tools** for any existing records; it is not part of the lumber sales process. The app does not copy opportunities into orders or include them in the lumber dashboard totals.

Order lines are products and quantities within an order. Add or open them through the order's **Order lines** relation. **Workspace tools → Order lines** provides a cross-order grid for bulk review. Custom reports, automations and email campaign tools also live in Workspace tools and are optional.

The Vercel installer applies this navigation once per application release. It preserves personal pins, custom links, business records and the owner's current invitation and authentication settings on updates. A standalone app installation adds the app entries; an administrator can make the same base-menu changes using Twenty's navigation editor and the display labels in Settings → Data model.

## Business records

| Area | How to use it |
| --- | --- |
| Customers & suppliers and Contacts | Keep one company directory and its existing contacts; add customer/supplier role, region, county and follow-up information. |
| Products | Link a supplier; record optional species, grade, dimensions, treatment, units, reference prices, samples and lead times. |
| Site visits | Schedule a customer visit, link a contact and sample product, record samples shown, photos, feedback and the next action. |
| Orders and order lines | Record quotes and confirmed orders separately; agree quantities, measurement units, pricing units, prices, supplier and delivery address. |
| Shipment lots | Link each delivery portion to one order line, with quantity, unit, reference, expected/actual dates and delay notes. |
| Reorder plans | Store the repeat interval in months, next need date, review date and active/paused state. Review dates surface work before the next delivery is needed. |
| Commissions | Keep the commission basis and rate unset until agreed; track expected and received commission and each side's payouts separately. |
| Overview | See confirmed order value, planned visits, undelivered shipment lots, commission amounts and sales/delivery status charts. |

No warehouse stock or inventory ownership is assumed. Companies and People remain Twenty's existing records.

## A first customer

1. Add the prospect under **Customers & suppliers**, then its contact under **Contacts**. Record a region/county and the next follow-up. The underlying objects remain Companies and People.
2. Add the supplier and a product. Specifications may remain blank while the catalog is being developed.
3. Schedule a **Site visit**. Record which samples were shown or left, the customer's feedback and the next action.
4. Open **Quotes & orders**, create an order with Quoted status, and add its **Order lines** from the order's details. Keep quantity and pricing units explicit: 1,000 board feet and 1 thousand board feet represent the same volume but different pricing quantities.
5. Confirm the order when the customer agrees. Customer payment status is independent of sales and shipment status.
6. In **Shipments**, add a **Shipment lot** for each order line/delivery portion. For 1,000 board feet delivered in two portions, use lots of 400 and 600. Use the same shipment reference for multiple lots travelling together. Lot counts on the dashboard are not truck counts.
7. Add a **Commission** linked to the order. Agree the eligible amount/basis and rate before marking terms confirmed. The calculation must not assume freight or tax is commissionable.
8. Record commission money received and payouts when they actually happen. Delivery alone does not imply payment.
9. For repeat business, create a **Reorder plan** and its review date. A plan represents anticipated business; a new confirmed order still requires customer agreement.

## Commission terms

Order value, commission income and your allocation are different amounts. For an illustrative $20,000 eligible amount at 5%, expected commission is $1,000. A confirmed 50/50 split would allocate $500 to your side and $500 to the partner pool. Partner-pool allocation is not $500 per individual partner.

The split remains a proposal until **Split confirmed** is checked. Confirm the intended partner arrangement before doing that. An unknown rate is **TBD**, not 0%. Rates and terms are stored on individual commission records so later deals can use different agreements.

Commission-created and commission-updated handlers recalculate expected commission and allocations from the current agreed terms. Received amounts and payouts remain actual amounts entered separately. Calculation helpers use integer money and currency-cent rounding; the current calculator supports USD. Reconcile payout history with accounting records.

## Recurring business

Reorder plans store calendar-month intervals and review dates. The planning tool calculates a review date from supplier lead time plus a review buffer and clamps month-end dates (for example January 31 to February 28/29). It previews dates; it does not create orders, send messages, or schedule supplier shipments. Use the review views alongside Twenty tasks for follow-up.

## Install and validate

See [SETUP.md](./SETUP.md) for installation into an existing workspace, local development and isolated tests. Nothing is installed into a live workspace until `twenty app apply --create` succeeds.

The app has no external commerce integrations, automatic supplier booking, customer invoicing or public customer portal. Shipment totals and order/line values should be reconciled when entering a transaction; this version does not automatically convert quantity units or enforce aggregate lot quantities across all deliveries.
