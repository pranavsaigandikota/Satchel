// package com.filmasticpg.premzone.item;

// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.http.HttpStatus;
// import org.springframework.http.ResponseEntity;
// import org.springframework.web.bind.annotation.*;

// import java.util.List;

// // Set it as RESTful web service
// @RestController
// // Set the base path for the endpoints (the url to access all the data)
// @RequestMapping(path = "api/v1/inventory")
// public class FoodInventoryItemController {
// private final FoodInventoryItemService foodInventoryItemService;

// // Best practice: Use constructor injection
// @Autowired
// // we get the service defined so we can use all its functions
// public FoodInventoryItemController(FoodInventoryItemService
// foodInventoryItemService) {
// this.foodInventoryItemService = foodInventoryItemService;
// }

// // --- 1. READ Operations (GET) ---

// /** * GET /api/v1/inventory?search={name}
// * GET /api/v1/inventory?category={category}
// * GET /api/v1/inventory : Fetch all items or search/filter
// */
// @GetMapping
// public ResponseEntity<List<FoodInventoryItem>> getItems(
// @RequestParam(required = false) String search,
// @RequestParam(required = false) String category) {

// if (search != null) {
// // Find items whose name contains the search text
// return ResponseEntity.ok(foodInventoryItemService.searchItemsByName(search));
// }

// if (category != null) {
// // Find items matching the category
// return
// ResponseEntity.ok(foodInventoryItemService.getFoodInventoryItemsByCategory(category));
// }

// // Default: Fetch all items
// return
// ResponseEntity.ok(foodInventoryItemService.getAllFoodInventoryItems());
// }

// /** GET /api/v1/inventory/{itemId} : Fetch item by ID */
// @GetMapping("/{itemId}")
// public ResponseEntity<FoodInventoryItem> getItemById(@PathVariable("itemId")
// Long id) {
// // Use orElseThrow() to handle the Optional gracefully and throw a 404 if not
// found
// FoodInventoryItem item = foodInventoryItemService.getItemById(id)
// .orElseThrow(() -> new ResourceNotFoundException("Item with ID " + id + " not
// found."));

// return ResponseEntity.ok(item);
// }

// /** GET /api/v1/inventory/expired : Fetch all expired items */
// @GetMapping("/expired")
// public ResponseEntity<List<FoodInventoryItem>> getExpiredItems() {
// return ResponseEntity.ok(foodInventoryItemService.getExpiredItems());
// }

// /** GET /api/v1/inventory/expiring-soon : Fetch items expiring in the next
// 'days' */
// @GetMapping("/expiring-soon")
// public ResponseEntity<List<FoodInventoryItem>> getItemsExpiringSoon(
// @RequestParam(defaultValue = "7") int days) { // Default to 7 days
// return
// ResponseEntity.ok(foodInventoryItemService.getItemsExpiringSoon(days));
// }

// // --- 2. CREATE Operation (POST) ---

// /** * POST /api/v1/inventory : Add a new item
// * @RequestBody maps JSON from the request body to the FoodInventoryItem
// object.
// */
// @PostMapping
// public ResponseEntity<FoodInventoryItem> registerNewItem(@RequestBody
// FoodInventoryItem item) {
// FoodInventoryItem savedItem = foodInventoryItemService.addNewItem(item);
// // Best practice: Return 201 Created status
// return new ResponseEntity<>(savedItem, HttpStatus.CREATED);
// }

// // --- 3. UPDATE Operation (PUT/PATCH) ---

// /** * PUT /api/v1/inventory/{itemId} : Update an existing item
// * Uses PUT for full replacement/update, or can be used for partial updates
// (PATCH) as we designed it.
// */
// @PutMapping("/{itemId}")
// public ResponseEntity<FoodInventoryItem> updateItem(
// @PathVariable("itemId") Long id,
// @RequestBody FoodInventoryItem itemDetails) {

// FoodInventoryItem updatedItem = foodInventoryItemService.updateItem(id,
// itemDetails);
// return ResponseEntity.ok(updatedItem);
// }

// // --- 4. DELETE Operation (DELETE) ---

// /** DELETE /api/v1/inventory/{itemId} : Delete an item by ID */
// @DeleteMapping("/{itemId}")
// public ResponseEntity<Void> deleteItem(@PathVariable("itemId") Long id) {
// foodInventoryItemService.deleteItem(id);
// // Best practice: Return 204 No Content for successful deletion
// return ResponseEntity.noContent().build();
// }
// }