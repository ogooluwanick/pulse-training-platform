const { MongoClient } = require('mongodb');
require('dotenv').config();

async function migrateToMemberships() {
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const usersCollection = db.collection('users');
    const companiesCollection = db.collection('companies');

    // Get all users with companyId
    const usersWithCompany = await usersCollection
      .find({
        companyId: { $exists: true, $ne: null },
      })
      .toArray();

    console.log(`Found ${usersWithCompany.length} users with companyId`);

    let migratedCount = 0;
    let errorCount = 0;

    for (const user of usersWithCompany) {
      try {
        // Check if company exists
        const company = await companiesCollection.findOne({
          _id: user.companyId,
        });

        if (!company) {
          console.log(
            `Company ${user.companyId} not found for user ${user._id}`
          );
          continue;
        }

        // Check if membership already exists
        const existingMembership = user.memberships?.find(
          (m) =>
            m.companyId.toString() === user.companyId.toString() &&
            m.status === 'active'
        );

        if (existingMembership) {
          console.log(
            `User ${user._id} already has membership in company ${user.companyId}`
          );
          continue;
        }

        // Create new membership
        const newMembership = {
          companyId: user.companyId,
          role: user.role === 'COMPANY' ? 'MANAGER' : 'EMPLOYEE',
          department: user.department,
          designation: user.designation,
          status: 'active',
          startedAt: new Date(),
        };

        // Add membership to user
        await usersCollection.updateOne(
          { _id: user._id },
          {
            $push: { memberships: newMembership },
            $set: {
              // Keep existing companyId for backward compatibility
              // but also set activeCompanyId for new system
              activeCompanyId: user.companyId,
            },
          }
        );

        console.log(`Migrated user ${user._id} to company ${user.companyId}`);
        migratedCount++;
      } catch (error) {
        console.error(`Error migrating user ${user._id}:`, error);
        errorCount++;
      }
    }

    console.log(`\nMigration completed:`);
    console.log(`- Successfully migrated: ${migratedCount} users`);
    console.log(`- Errors: ${errorCount} users`);

    // Update CourseAssignment companyId references
    console.log('\nUpdating CourseAssignment companyId references...');

    const courseAssignmentsCollection = db.collection('courseassignments');
    const assignments = await courseAssignmentsCollection
      .find({
        companyId: { $exists: true },
      })
      .toArray();

    let assignmentUpdateCount = 0;

    for (const assignment of assignments) {
      try {
        // Check if the companyId references a User (old system) or Company (new system)
        const company = await companiesCollection.findOne({
          _id: assignment.companyId,
        });

        if (company) {
          // Already references Company, no update needed
          continue;
        }

        // Check if it references a User (company account)
        const user = await usersCollection.findOne({
          _id: assignment.companyId,
          role: 'COMPANY',
        });

        if (user) {
          // Update to reference the company instead of the user
          await courseAssignmentsCollection.updateOne(
            { _id: assignment._id },
            { $set: { companyId: user.companyId } }
          );
          console.log(
            `Updated assignment ${assignment._id} companyId from user to company`
          );
          assignmentUpdateCount++;
        }
      } catch (error) {
        console.error(`Error updating assignment ${assignment._id}:`, error);
      }
    }

    console.log(`Updated ${assignmentUpdateCount} course assignments`);
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run migration
migrateToMemberships().catch(console.error);
