const mongoose = require('mongoose');

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI ||
        'mongodb://localhost:27017/pulse-training-platform'
    );
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Define minimal schemas
const CourseAssignmentSchema = new mongoose.Schema({}, { strict: false });
const UserSchema = new mongoose.Schema({}, { strict: false });
const CourseSchema = new mongoose.Schema({}, { strict: false });

const CourseAssignment =
  mongoose.models.CourseAssignment ||
  mongoose.model('CourseAssignment', CourseAssignmentSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Course = mongoose.models.Course || mongoose.model('Course', CourseSchema);

async function debugAggregationPipeline() {
  const companyId = '6886a4d4e733962f77f78bff'; // From your logs

  console.log('🔍 Step-by-step aggregation debugging...\n');

  // Step 0: Check ALL assignments first
  console.log('STEP 0: Check all assignments in database');
  const allAssignments = await CourseAssignment.find({}).limit(10);
  console.log(`   Total assignments found: ${allAssignments.length}`);

  allAssignments.forEach((assignment, index) => {
    console.log(`   ${index + 1}. Assignment ID: ${assignment._id}`);
    console.log(`      Course ID: ${assignment.course}`);
    console.log(`      Employee ID: ${assignment.employee}`);
    console.log(
      `      Company ID: ${assignment.companyId} (type: ${typeof assignment.companyId})`
    );
    console.log(`      Status: ${assignment.status}`);
    console.log('');
  });

  // Step 1: Check the raw assignment
  console.log('STEP 1: Raw assignment data - trying different queries');

  // Try with ObjectId
  const rawAssignment1 = await CourseAssignment.findOne({
    companyId: new mongoose.Types.ObjectId(companyId),
  });
  console.log(
    '   Query with ObjectId:',
    rawAssignment1 ? 'FOUND' : 'NOT FOUND'
  );

  // Try with string
  const rawAssignment2 = await CourseAssignment.findOne({
    companyId: companyId,
  });
  console.log('   Query with string:', rawAssignment2 ? 'FOUND' : 'NOT FOUND');

  // Try finding by any assignment that matches the companyId pattern
  const rawAssignment3 = await CourseAssignment.findOne({
    $or: [
      { companyId: new mongoose.Types.ObjectId(companyId) },
      { companyId: companyId },
    ],
  });
  console.log(
    '   Query with multiple formats:',
    rawAssignment3 ? 'FOUND' : 'NOT FOUND'
  );

  const rawAssignment = rawAssignment1 || rawAssignment2 || rawAssignment3;

  if (!rawAssignment) {
    console.log(
      '❌ No assignment found for this company with any query method'
    );

    // Check what companyIds actually exist
    const distinctCompanyIds = await CourseAssignment.distinct('companyId');
    console.log(
      '   Distinct companyIds in database:',
      distinctCompanyIds.map((id) => `${id} (type: ${typeof id})`)
    );
    return;
  }

  console.log('✅ Found assignment:');
  console.log('   Assignment ID:', rawAssignment._id);
  console.log('   Course ID:', rawAssignment.course);
  console.log('   Employee ID:', rawAssignment.employee);
  console.log('   Company ID:', rawAssignment.companyId);
  console.log('   Status:', rawAssignment.status);

  // Step 2: Check if course exists
  console.log('\nSTEP 2: Check if course exists');
  const courseExists = await Course.findById(rawAssignment.course);
  if (courseExists) {
    console.log('✅ Course exists:', courseExists.title);
  } else {
    console.log('❌ Course NOT FOUND for ID:', rawAssignment.course);
    console.log(
      '   This will cause $unwind to fail and remove the assignment from results'
    );
  }

  // Step 3: Check if employee exists
  console.log('\nSTEP 3: Check if employee exists');
  const employeeExists = await User.findById(rawAssignment.employee);
  if (employeeExists) {
    console.log(
      '✅ Employee exists:',
      employeeExists.firstName,
      employeeExists.lastName,
      `(${employeeExists.email})`
    );
  } else {
    console.log('❌ Employee NOT FOUND for ID:', rawAssignment.employee);
    console.log(
      '   This will cause $unwind to fail and remove the assignment from results'
    );
  }

  // Step 4: Test aggregation step by step
  console.log('\nSTEP 4: Testing aggregation pipeline step by step');

  // Step 4a: Just the match
  const step1 = await CourseAssignment.aggregate([
    {
      $match: {
        companyId: new mongoose.Types.ObjectId(companyId),
      },
    },
  ]);
  console.log(`   After $match: ${step1.length} documents`);

  // Step 4b: Add course lookup
  const step2 = await CourseAssignment.aggregate([
    {
      $match: {
        companyId: new mongoose.Types.ObjectId(companyId),
      },
    },
    {
      $lookup: {
        from: 'courses',
        localField: 'course',
        foreignField: '_id',
        as: 'courseDetails',
      },
    },
  ]);
  console.log(`   After course $lookup: ${step2.length} documents`);
  if (step2.length > 0) {
    console.log(
      `   Course lookup result: ${step2[0].courseDetails.length} courses found`
    );
  }

  // Step 4c: Add employee lookup
  const step3 = await CourseAssignment.aggregate([
    {
      $match: {
        companyId: new mongoose.Types.ObjectId(companyId),
      },
    },
    {
      $lookup: {
        from: 'courses',
        localField: 'course',
        foreignField: '_id',
        as: 'courseDetails',
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'employee',
        foreignField: '_id',
        as: 'employeeDetails',
      },
    },
  ]);
  console.log(`   After employee $lookup: ${step3.length} documents`);
  if (step3.length > 0) {
    console.log(
      `   Employee lookup result: ${step3[0].employeeDetails.length} employees found`
    );
  }

  // Step 4d: Add course unwind (this is where it likely fails)
  try {
    const step4 = await CourseAssignment.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(companyId),
        },
      },
      {
        $lookup: {
          from: 'courses',
          localField: 'course',
          foreignField: '_id',
          as: 'courseDetails',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'employee',
          foreignField: '_id',
          as: 'employeeDetails',
        },
      },
      {
        $unwind: '$courseDetails',
      },
    ]);
    console.log(`   After course $unwind: ${step4.length} documents`);
  } catch (error) {
    console.log('❌ Course $unwind failed:', error.message);
  }

  // Step 4e: Add employee unwind
  try {
    const step5 = await CourseAssignment.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(companyId),
        },
      },
      {
        $lookup: {
          from: 'courses',
          localField: 'course',
          foreignField: '_id',
          as: 'courseDetails',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'employee',
          foreignField: '_id',
          as: 'employeeDetails',
        },
      },
      {
        $unwind: '$courseDetails',
      },
      {
        $unwind: '$employeeDetails',
      },
    ]);
    console.log(`   After employee $unwind: ${step5.length} documents`);
  } catch (error) {
    console.log('❌ Employee $unwind failed:', error.message);
  }

  // Step 5: Show collection stats
  console.log('\nSTEP 5: Collection statistics');
  const totalCourses = await Course.countDocuments();
  const totalUsers = await User.countDocuments();
  const totalAssignments = await CourseAssignment.countDocuments();

  console.log(`   Total courses: ${totalCourses}`);
  console.log(`   Total users: ${totalUsers}`);
  console.log(`   Total assignments: ${totalAssignments}`);

  // Step 6: Check collection names (case sensitivity)
  console.log('\nSTEP 6: Checking collection names');
  const collections = await mongoose.connection.db.listCollections().toArray();
  const collectionNames = collections.map((c) => c.name);
  console.log('   Available collections:', collectionNames);
  console.log('   Looking for: courses, users, courseassignments');
}

async function main() {
  await connectDB();
  await debugAggregationPipeline();
  mongoose.connection.close();
  console.log('\n✅ Debug completed');
}

main().catch(console.error);
