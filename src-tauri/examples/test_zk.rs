use std::time::Duration;
use zookeeper_client::{Client, SessionState, CreateMode, Acls};

fn main() {
    println!("=== ZooKeeper Full Function Test ===\n");
    println!("Connecting to 172.16.120.82:2181...\n");

    let rt = tokio::runtime::Runtime::new().expect("Failed to create runtime");

    let result = rt.block_on(async {
        let connector = Client::connector()
            .with_session_timeout(Duration::from_secs(10))
            .with_connection_timeout(Duration::from_secs(10));

        let client = connector.connect("172.16.120.82:2181").await
            .map_err(|e| format!("Connection failed: {:?}", e))?;

        println!("✓ Connected! State: {:?}\n", client.state());

        // 1. Test list_children on root
        println!("=== Test 1: List children of / ===");
        match client.list_children("/").await {
            Ok(children) => {
                println!("✓ Found {} children:", children.len());
                for child in children.iter().take(10) {
                    println!("  - {}", child);
                }
                if children.len() > 10 {
                    println!("  ... and {} more", children.len() - 10);
                }
            }
            Err(e) => println!("✗ Failed: {:?}", e),
        }

        // 2. Test get_data on /zookeeper
        println!("\n=== Test 2: Get data of /zookeeper ===");
        match client.get_data("/zookeeper").await {
            Ok((data, stat)) => {
                println!("✓ Data length: {} bytes", data.len());
                println!("✓ Stat: version={}, ctime={}, mtime={}",
                    stat.version, stat.ctime, stat.mtime);
            }
            Err(e) => println!("✗ Failed: {:?}", e),
        }

        // 3. Test exists
        println!("\n=== Test 3: Check if /zookeeper exists ===");
        match client.check_stat("/zookeeper").await {
            Ok(Some(stat)) => {
                println!("✓ Node exists, num_children={}", stat.num_children);
            }
            Ok(None) => println!("✗ Node does not exist"),
            Err(e) => println!("✗ Failed: {:?}", e),
        }

        // 4. Test exists on non-existent node
        println!("\n=== Test 4: Check if /nonexistent_node_xyz exists ===");
        match client.check_stat("/nonexistent_node_xyz").await {
            Ok(Some(_)) => println!("✗ Node should not exist!"),
            Ok(None) => println!("✓ Node correctly does not exist"),
            Err(e) => println!("✗ Failed: {:?}", e),
        }

        // 5. Test list_children on /zookeeper
        println!("\n=== Test 5: List children of /zookeeper ===");
        match client.list_children("/zookeeper").await {
            Ok(children) => {
                println!("✓ Children: {:?}", children);
            }
            Err(e) => println!("✗ Failed: {:?}", e),
        }

        // 6. Test create, set_data, get_data, delete (on a test node)
        let test_path = "/test_rust_client_temp";
        println!("\n=== Test 6: Create/Set/Get/Delete node {} ===", test_path);

        // Delete first if exists
        let _ = client.delete(test_path, None).await;

        // Create
        println!("  Creating node...");
        let options = CreateMode::Persistent.with_acls(Acls::anyone_all());
        match client.create(test_path, b"initial_data", &options).await {
            Ok((stat, _seq)) => {
                println!("✓ Node created, version={}", stat.version);
            }
            Err(e) => {
                println!("✗ Create failed: {:?}", e);
                return Err(format!("Create failed: {:?}", e));
            }
        }

        // Get data
        println!("  Getting data...");
        match client.get_data(test_path).await {
            Ok((data, stat)) => {
                let data_str = String::from_utf8_lossy(&data);
                println!("✓ Data: '{}', version={}", data_str, stat.version);
            }
            Err(e) => println!("✗ Get failed: {:?}", e),
        }

        // Set data
        println!("  Setting data...");
        match client.set_data(test_path, b"updated_data", Some(0)).await {
            Ok(stat) => {
                println!("✓ Data updated, new version={}", stat.version);
            }
            Err(e) => println!("✗ Set failed: {:?}", e),
        }

        // Get data again to verify
        println!("  Verifying data...");
        match client.get_data(test_path).await {
            Ok((data, stat)) => {
                let data_str = String::from_utf8_lossy(&data);
                println!("✓ Data: '{}', version={}", data_str, stat.version);
            }
            Err(e) => println!("✗ Get failed: {:?}", e),
        }

        // Delete
        println!("  Deleting node...");
        match client.delete(test_path, Some(1)).await {
            Ok(()) => {
                println!("✓ Node deleted");
            }
            Err(e) => println!("✗ Delete failed: {:?}", e),
        }

        // Verify deleted
        println!("  Verifying deletion...");
        match client.check_stat(test_path).await {
            Ok(Some(_)) => println!("✗ Node still exists!"),
            Ok(None) => println!("✓ Node correctly deleted"),
            Err(e) => println!("✗ Check failed: {:?}", e),
        }

        // 7. Test get_data on a real node
        println!("\n=== Test 7: Get data from real node /config ===");
        match client.list_children("/config").await {
            Ok(children) => {
                if !children.is_empty() {
                    let first_child = &children[0];
                    let path = format!("/config/{}", first_child);
                    println!("  Checking /config/{}", first_child);
                    match client.get_data(&path).await {
                        Ok((data, stat)) => {
                            println!("✓ Data length: {} bytes, version={}", data.len(), stat.version);
                        }
                        Err(e) => println!("✗ Get failed: {:?}", e),
                    }
                } else {
                    println!("  No children in /config");
                }
            }
            Err(e) => println!("✗ List /config failed: {:?}", e),
        }

        println!("\n=== All Tests Completed ===");
        Ok(())
    });

    match result {
        Ok(_) => println!("\n✓ All tests PASSED"),
        Err(e) => println!("\n✗ Tests FAILED: {}", e),
    }
}