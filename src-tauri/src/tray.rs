use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    App, Manager,
};

use crate::error::AppResult;

// 默认图标数据 - 32x32 RGBA
fn get_default_icon() -> Vec<u8> {
    // 创建一个简单的 32x32 蓝色图标
    let size = 32u32;
    let mut rgba = Vec::with_capacity((size * size * 4) as usize);

    for y in 0..size {
        for x in 0..size {
            // 创建渐变效果
            let dx = (x as i32 - 16).abs();
            let dy = (y as i32 - 16).abs();
            let dist = ((dx * dx + dy * dy) as f64).sqrt();
            let alpha = if dist < 14.0 { 255 } else { 0 };

            // 蓝色
            rgba.push(59);   // R
            rgba.push(130);  // G
            rgba.push(246);  // B
            rgba.push(alpha); // A
        }
    }

    rgba
}

pub fn setup_tray(app: &App) -> AppResult<()> {
    // 创建托盘菜单项
    let show_item = MenuItem::with_id(app, "show", "显示窗口", true, None::<&str>)
        .map_err(|e| crate::error::AppError::Internal(format!("Failed to create menu item: {}", e)))?;

    let hide_item = MenuItem::with_id(app, "hide", "隐藏窗口", true, None::<&str>)
        .map_err(|e| crate::error::AppError::Internal(format!("Failed to create menu item: {}", e)))?;

    let quit_item = MenuItem::with_id(app, "quit", "退出程序", true, None::<&str>)
        .map_err(|e| crate::error::AppError::Internal(format!("Failed to create menu item: {}", e)))?;

    let menu = Menu::with_items(app, &[&show_item, &hide_item, &quit_item])
        .map_err(|e| crate::error::AppError::Internal(format!("Failed to create menu: {}", e)))?;

    // 创建图标
    let icon = tauri::image::Image::new_owned(get_default_icon(), 32, 32);

    // 创建托盘图标
    let _tray = TrayIconBuilder::new()
        .icon(icon)
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            "hide" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.hide();
                }
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let tauri::tray::TrayIconEvent::Click { button, .. } = event {
                // 左键点击显示窗口
                if button == tauri::tray::MouseButton::Left {
                    let app = tray.app_handle();
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
            }
        })
        .build(app)
        .map_err(|e| crate::error::AppError::Internal(format!("Failed to create tray: {}", e)))?;

    Ok(())
}