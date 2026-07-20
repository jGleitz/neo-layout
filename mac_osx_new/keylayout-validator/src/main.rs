use keylayout_core::{parse_keylayout, repair, serialize_keylayout, validate, EncodeOpts, Severity};
use std::env;
use std::fs;
use std::path::{Path, PathBuf};

struct Args {
    paths: Vec<PathBuf>,
    strict: bool,
    repair: bool,
    output_dir: Option<PathBuf>,
}

fn parse_args() -> Args {
    let mut args = Args {
        paths: Vec::new(),
        strict: false,
        repair: false,
        output_dir: None,
    };

    let mut iter = env::args().skip(1);
    while let Some(arg) = iter.next() {
        match arg.as_str() {
            "--strict" => args.strict = true,
            "--repair" => args.repair = true,
            "--output-dir" => {
                let value = iter
                    .next()
                    .unwrap_or_else(|| panic!("--output-dir requires a directory path"));
                args.output_dir = Some(PathBuf::from(value));
            }
            "-h" | "--help" => {
                print_help();
                std::process::exit(0);
            }
            _ => args.paths.push(PathBuf::from(arg)),
        }
    }

    args
}

fn print_help() {
    println!("Usage: keylayout-validator [OPTIONS] <PATH>...");
    println!();
    println!("Validate macOS .keylayout files using Keymano's keylayout-core.");
    println!();
    println!("Arguments:");
    println!("  <PATH>...          Files or directories to validate");
    println!();
    println!("Options:");
    println!("  --strict           Fail on warnings as well as errors");
    println!("  --repair           Apply auto-repairs to fixable issues");
    println!("  --output-dir DIR   Write repaired files to DIR (requires --repair)");
    println!("  -h, --help         Print help");
}

fn collect_keylayouts(path: &Path) -> Result<Vec<PathBuf>, Box<dyn std::error::Error>> {
    let mut files = Vec::new();

    if path.is_file() {
        if path.extension().and_then(|s| s.to_str()) == Some("keylayout") {
            files.push(path.to_path_buf());
        }
    } else if path.is_dir() {
        for entry in fs::read_dir(path)? {
            let entry = entry?;
            let child = entry.path();
            if child.is_dir() {
                files.extend(collect_keylayouts(&child)?);
            } else if child.extension().and_then(|s| s.to_str()) == Some("keylayout") {
                files.push(child);
            }
        }
    }

    Ok(files)
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args = parse_args();

    if args.paths.is_empty() {
        eprintln!("Error: no paths provided");
        print_help();
        std::process::exit(2);
    }

    if let Some(out_dir) = &args.output_dir {
        if !args.repair {
            eprintln!("Error: --output-dir requires --repair");
            std::process::exit(2);
        }
        fs::create_dir_all(out_dir)?;
    }

    let mut any_errors = false;
    let mut any_warnings = false;
    let mut files_checked = 0;

    for path in &args.paths {
        let files = collect_keylayouts(path)?;

        if files.is_empty() {
            eprintln!("Warning: no .keylayout files found under {}", path.display());
        }

        for file in files {
            files_checked += 1;
            let xml = fs::read_to_string(&file)?;
            let mut kb = parse_keylayout(&xml)?;
            let issues = validate(&kb);

            let errors: Vec<_> = issues
                .iter()
                .filter(|i| i.severity == Severity::Error)
                .collect();
            let warnings: Vec<_> = issues
                .iter()
                .filter(|i| i.severity == Severity::Warning)
                .collect();

            if !errors.is_empty() || !warnings.is_empty() {
                println!("{}:", file.display());
                for issue in &issues {
                    println!(
                        "  [{:?}] {}: {}",
                        issue.severity, issue.code, issue.message
                    );
                }
            }

            any_errors |= !errors.is_empty();
            any_warnings |= !warnings.is_empty();

            if args.repair {
                let report = repair(&mut kb);
                if !report.fixed.is_empty() {
                    let out_path = match &args.output_dir {
                        Some(dir) => {
                            let name = file
                                .file_name()
                                .expect("file should have a name")
                                .to_owned();
                            dir.join(name)
                        }
                        None => file.clone(),
                    };
                    let fixed_xml = serialize_keylayout(&kb, &EncodeOpts::default());
                    fs::write(&out_path, fixed_xml)?;
                    println!("  repaired -> {}", out_path.display());
                }
            }
        }
    }

    println!();
    println!("Checked {} file(s)", files_checked);

    if any_errors || (args.strict && any_warnings) {
        eprintln!();
        eprintln!("Validation failed.");
        std::process::exit(1);
    }

    if any_warnings {
        println!("Validation passed with warnings (use --strict to fail on warnings).");
    } else {
        println!("Validation passed.");
    }

    Ok(())
}
