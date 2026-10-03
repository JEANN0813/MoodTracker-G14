from backend import create_app

app = create_app()



print("\n=== Registered Routes ===")
for rule in app.url_map.iter_rules():
    print(f"{rule.methods} {rule.rule}")
print("=== End ===\n")
    

if __name__ == '__main__':
     

    print()
    print("MoodTracker Server Starting...")
    print()
    print(f"Database: {app.config['SQLALCHEMY_DATABASE_URI']}")
    print(f"Server: http://127.0.0.1:5000")
    print(f"Static folder: static/")
    print(f"Debug Mode: ON")
    print()
    print("Access the web app:")
    print("  http://127.0.0.1:5000")
    print()
    print("Press Ctrl+C to stop the server")
    print()
    
    app.run(debug=True, host='0.0.0.0', port=5000)

