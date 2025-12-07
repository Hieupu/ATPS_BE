/**
 * Test script để kiểm tra việc lấy TimeslotID từ database
 * Chạy: node scripts/testTimeslotRetrieval.js [TimeslotID]
 */

const timeslotRepository = require("../repositories/timeslotRepository");
const { validateDateDayConsistency } = require("../utils/sessionValidation");

async function testTimeslotRetrieval(timeslotId) {
  console.log("=".repeat(60));
  console.log(`Testing TimeslotID: ${timeslotId}`);
  console.log("=".repeat(60));

  try {
    // 1. Test findById
    console.log("\n[1] Testing timeslotRepository.findById()...");
    const timeslot = await timeslotRepository.findById(timeslotId);
    
    if (!timeslot) {
      console.error(`❌ Timeslot với ID ${timeslotId} không tồn tại trong database`);
      return;
    }

    console.log("✅ Timeslot found:");
    console.log(JSON.stringify(timeslot, null, 2));
    console.log(`\n   - TimeslotID: ${timeslot.TimeslotID}`);
    console.log(`   - StartTime: ${timeslot.StartTime}`);
    console.log(`   - EndTime: ${timeslot.EndTime}`);
    console.log(`   - Day: ${timeslot.Day || "NULL (không có trường Day)"}`);

    // 2. Test validateDateDayConsistency với các ngày khác nhau
    console.log("\n[2] Testing validateDateDayConsistency()...");
    
    const testDates = [
      "2025-12-08", // T2
      "2025-12-09", // T3
      "2025-12-10", // T4
      "2025-12-14", // CN
    ];

    for (const testDate of testDates) {
      console.log(`\n   Testing với Date: ${testDate}`);
      const sessionData = {
        TimeslotID: parseInt(timeslotId),
        Date: testDate,
      };

      const result = await validateDateDayConsistency(sessionData);
      console.log(`   - isValid: ${result.isValid}`);
      if (!result.isValid) {
        console.log(`   - error: ${result.error}`);
      }
      if (result.details) {
        console.log(`   - details:`, result.details);
      }
    }

    // 3. Kiểm tra xem có bao nhiêu timeslots trong database
    console.log("\n[3] Checking total timeslots in database...");
    const allTimeslots = await timeslotRepository.findAll({ limit: 1000 });
    console.log(`   - Total timeslots: ${allTimeslots.pagination.total}`);
    
    // 4. Kiểm tra các timeslots có Day
    console.log("\n[4] Checking timeslots with Day field...");
    const timeslotsWithDay = allTimeslots.data.filter(t => t.Day);
    const timeslotsWithoutDay = allTimeslots.data.filter(t => !t.Day);
    console.log(`   - Timeslots có Day: ${timeslotsWithDay.length}`);
    console.log(`   - Timeslots không có Day: ${timeslotsWithoutDay.length}`);
    
    if (timeslotsWithDay.length > 0) {
      console.log("\n   Sample timeslots với Day:");
      timeslotsWithDay.slice(0, 5).forEach(t => {
        console.log(`     - TimeslotID ${t.TimeslotID}: ${t.StartTime}-${t.EndTime}, Day=${t.Day}`);
      });
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ Test completed successfully!");
    console.log("=".repeat(60));

  } catch (error) {
    console.error("\n❌ Error during test:", error);
    console.error(error.stack);
  } finally {
    // Close database connection
    const pool = require("../config/db");
    await pool.end();
    process.exit(0);
  }
}

// Main
const timeslotId = process.argv[2] || "24"; // Default to 24 if not provided
testTimeslotRetrieval(timeslotId);

