"""
Test script for the Credio AI Server
Tests both YOLO detection and GPT-4 Vision fallback
"""

import requests
import base64
import json
from pathlib import Path

BASE_URL = "http://localhost:5000"


def test_health():
    """Test health endpoint"""
    print("Testing health endpoint...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print()


def test_disaster_types():
    """Test disaster types endpoint"""
    print("Testing disaster types endpoint...")
    response = requests.get(f"{BASE_URL}/api/disaster-types")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print()


def test_detection_with_sample():
    """Test detection with a sample base64 image"""
    print("Testing detection endpoint...")

    # Create a simple test image (you can replace this with actual base64)
    # For this test, we'll use a placeholder
    sample_image = "data:image/jpeg;base64,/9j/4AAQSkZJRg..."

    payload = {"image": sample_image, "disasterType": "tsunami"}

    try:
        response = requests.post(
            f"{BASE_URL}/api/detect-kit-items",
            json=payload,
            headers={"Content-Type": "application/json"},
        )
        print(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print(f"Detection Method: {result.get('detectionMethod')}")
            print(f"Disaster Type: {result.get('disasterType')}")
            print(f"Required Items: {result.get('requiredItems')}")
            print("\nChecklist:")
            for item in result.get("checklist", []):
                status = "✓" if item["detected"] else "✗"
                confidence = (
                    f"{item['confidence']*100:.0f}%" if item["detected"] else "N/A"
                )
                print(f"  {status} {item['name']}: {confidence}")
        else:
            print(f"Error: {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
    print()


def main():
    print("=" * 50)
    print("Credio AI Server Test Suite")
    print("=" * 50)
    print()

    try:
        test_health()
        test_disaster_types()

        print("Note: For full detection testing, use the web interface")
        print("or provide a valid base64 encoded image in test_detection_with_sample()")
        print()

    except requests.exceptions.ConnectionError:
        print("ERROR: Could not connect to the AI server.")
        print("Make sure the server is running on http://localhost:5000")
        print("Run: python app.py")


if __name__ == "__main__":
    main()
