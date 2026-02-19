#!/usr/bin/env python3
"""
Test script for all Semantic Scholar API endpoints
"""

import requests
import json
import sys
import time  # For rate limiting

BASE_URL = "http://localhost:8080"
ADMIN_TOKEN = "1234"  # Match your .env


def test_search_authors():
    """Test 1: Search Authors endpoint"""
    print("\n" + "=" * 70)
    print("TEST 1: searchAuthors(query, limit)")
    print("=" * 70)
    
    response = requests.get(
        f"{BASE_URL}/api/v1/semantic-scholar/authors/search",
        params={"q": "Ho Thi Hoang Vy", "limit": 20},
        headers={"X-Admin-Token": ADMIN_TOKEN}
    )
    
    print(f"📡 Status: {response.status_code}")
    
    if response.status_code != 200:
        print(f"❌ Failed: {response.text}")
        return None
    
    result = response.json()
    print(f"✅ Success!")
    
    data_wrapper = result.get('data', {})
    authors = data_wrapper.get('data', [])
    
    print(f"Found {len(authors)} authors")
    
    if len(authors) > 0:
        first_author = authors[0]
        print("\n🔍 Verifying Fields (Expecting detailed stats):")
        print(f"  Name: {first_author.get('name')}")
        print(f"  ID: {first_author.get('authorId')}")
        print(f"  Affiliations: {first_author.get('affiliations')}")
        print(f"  PaperCount: {first_author.get('paperCount')}")
        print(f"  CitationCount: {first_author.get('citationCount')}")
        print(f"  H-Index: {first_author.get('hIndex')}")
        
    # Return first authorId for next test
    if len(authors) > 0:
        author_id = authors[0].get('authorId')
        print(f"\n⏱️  Waiting 1 second (rate limit)...")
        time.sleep(1)  # Respect Semantic Scholar rate limits
        return author_id
    return None


def test_get_author_details(author_id):
    """Test 2: Get Author Details endpoint"""
    print("\n" + "=" * 70)
    print(f"TEST 2: getAuthorDetails(authorId = '{author_id}')")
    print("=" * 70)
    
    response = requests.get(
        f"{BASE_URL}/api/v1/semantic-scholar/authors/{author_id}",
        headers={"X-Admin-Token": ADMIN_TOKEN}
    )
    
    print(f"📡 Status: {response.status_code}")
    
    if response.status_code != 200:
        print(f"❌ Failed: {response.text}")
        return
    
    result = response.json()
    print(f"✅ Success!")
    print(f"\n📦 Response structure:")
    print(json.dumps(result, indent=2))
    
    print(f"\n🔍 Analysis:")
    print(f"  result type: {type(result).__name__}")
    print(f"  result keys: {list(result.keys())}")
    if 'data' in result:
        print(f"  result['data'] type: {type(result['data']).__name__}")
        if isinstance(result['data'], dict):
            print(f"  result['data'] keys: {list(result['data'].keys())}")
    
    print(f"\n💡 Frontend access:")
    print(f"  const author = await semanticScholarApi.getAuthorDetails(authorId);")
    print(f"  // author is AuthorWithPapers object")
    
    print(f"\n⏱️  Waiting 1 second (rate limit)...")
    time.sleep(1)  # Respect Semantic Scholar rate limits


def test_get_author_papers(author_id):
    """Test 3: Get Author Papers endpoint"""
    print("\n" + "=" * 70)
    print(f"TEST 3: getAuthorPapers(authorId = '{author_id}', offset = 0, limit = 10)")
    print("=" * 70)
    
    response = requests.get(
        f"{BASE_URL}/api/v1/semantic-scholar/authors/{author_id}/papers",
        params={"offset": 0, "limit": 10},
        headers={"X-Admin-Token": ADMIN_TOKEN}
    )
    
    print(f"📡 Status: {response.status_code}")
    
    if response.status_code != 200:
        print(f"❌ Failed: {response.text}")
        return
    
    result = response.json()
    print(f"✅ Success!")
    print(f"\n📦 Response structure:")
    print(json.dumps(result, indent=2))
    
    print(f"\n🔍 Analysis:")
    print(f"  result type: {type(result).__name__}")
    print(f"  result keys: {list(result.keys())}")
    if 'data' in result:
        print(f"  result['data'] type: {type(result['data']).__name__}")
        if isinstance(result['data'], dict):
            print(f"  result['data'] keys: {list(result['data'].keys())}")
            if 'data' in result['data']:
                print(f"  result['data']['data'] type: {type(result['data']['data']).__name__}")
                print(f"  result['data']['data'] length: {len(result['data']['data']) if isinstance(result['data']['data'], list) else 'N/A'}")
    
    print(f"\n💡 Frontend access:")
    print(f"  const papers = await semanticScholarApi.getAuthorPapers(authorId);")
    print(f"  const papersList = papers.data;  // ← This is the Paper[] array")


def main():
    print("=" * 70)
    print("Semantic Scholar API - Complete Test Suite")
    print("=" * 70)
    print(f"🌐 Backend: {BASE_URL}")
    print(f"🔑 Auth: X-Admin-Token bypass")
    
    # Test 1: Search Authors
    author_id = test_search_authors()
    
    if not author_id:
        print("\n⚠️  Cannot proceed with other tests - no author found")
        return
    
    # Test 2: Get Author Details
    test_get_author_details(author_id)
    
    # Test 3: Get Author Papers
    test_get_author_papers(author_id)
    
    # Summary
    print("\n" + "=" * 70)
    print("📊 SUMMARY - Response Structure Patterns")
    print("=" * 70)
    print("\n✅ All endpoints return: {\"data\": <ActualData>}")
    print("\n1️⃣  searchAuthors → {\"data\": SearchResponse{total, offset, data: Author[]}}")
    print("    Frontend: response.data = Author[]")
    print("\n2️⃣  getAuthorDetails → {\"data\": AuthorWithPapers}")
    print("    Frontend: response = AuthorWithPapers object")
    print("\n3️⃣  getAuthorPapers → {\"data\": PapersResponse{offset, next, data: Paper[]}}")
    print("    Frontend: response.data = Paper[]")
    print("\n" + "=" * 70)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Interrupted")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
