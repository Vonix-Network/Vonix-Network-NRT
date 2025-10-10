# Testing Setup Guide

## Quick Start Testing

### **Step 1: Start Your Application**
```bash
# Terminal 1 - Start the API server (port 5000)
cd server
npm start

# Terminal 2 - Start the client app (port 3000)
cd client  
npm start
```
### **Step 2: Run Automated Tests**

#### Option A: Simple File Structure Test (Recommended First)
```bash
# Test file structure and component cleanup without API calls
node simple-test.js
```

#### Option B: Full API Test Suite (After servers are running)
```bash
# Run the full automated test script (requires API server running)
node test-script.js

# Or add to package.json scripts:
npm run test:automated
```

### 3. Manual Testing Checklist
Follow the comprehensive checklist in `TESTING_CHECKLIST.md`

## Test Script Configuration

### Environment Variables
```bash
# Set your API base URL (default: http://localhost:5000)
export API_BASE_URL=http://localhost:5000

# Set your client URL (default: http://localhost:3000)  
export CLIENT_URL=http://localhost:3000

# For production testing:
export API_BASE_URL=https://api.your-production-url.com
export CLIENT_URL=https://your-production-url.com
```

### Test User Setup
The script uses a test user account. Make sure you have:
- Username: `testuser`
- Password: `testpass123`
- Email: `test@vonix.network`

Or modify the CONFIG object in `test-script.js`

## What the Script Tests

### ✅ Automated Tests
- API endpoint availability
- Database connectivity
- Forum/topic data retrieval
- Authentication flows
- File structure integrity
- Component import validation
- CSS responsive structure
- Basic performance metrics

### ⚠️ Manual Testing Required
- Visual design consistency
- Cross-browser compatibility
- Mobile touch interactions
- Accessibility features
- User experience flows
- Real-world usage patterns

## Test Results

### Success Criteria
- **80%+ pass rate** for automated tests
- **All critical manual tests** must pass
- **No console errors** in browser
- **Mobile responsiveness** confirmed across devices

### Output Files
- `test-results.json` - Detailed automated test results
- Console output with color-coded results

## Pre-Release Checklist

1. ✅ Run automated test script
2. ✅ Complete manual testing checklist
3. ✅ Test on multiple devices/browsers
4. ✅ Verify no mobile variants remain
5. ✅ Check responsive breakpoints (900px, 480px)

## Common Issues & Fixes

### **If API connection fails:**
- Make sure your server is running on port 5000
- Check that `http://localhost:5000/health` works in browser
- Verify API_BASE_URL environment variable
- Ensure no other services are using port 5000

### Component Tests Failed
- Ensure all mobile variant code is removed
- Check that ForumCard.tsx and TopicCard.tsx exist
- Verify no `variant="mobile"` props remain
{{ ... }}
### CSS Tests Failed
- Confirm ForumViewPage.css has responsive breakpoints
- Remove any `.mobile-topic-card` classes
- Ensure `@media (max-width: 900px)` exists

### Performance Issues
- Optimize database queries
- Compress images and assets
- Enable gzip compression
- Use CDN for static assets

## Ready for GitHub Release?

✅ **All automated tests pass (80%+)**  
✅ **Critical manual tests completed**  
✅ **Mobile design is clean and unified**  
✅ **No gray separator lines on mobile**  
✅ **Responsive breakpoints work correctly**  
✅ **Cross-browser compatibility confirmed**  
✅ **Documentation is up to date**  

🚀 **Ready to publish!**
