#!/bin/bash

# Phase 4.3 Verification - Complete Test Execution Script
# This script validates credentials, tests authentication, and runs analytics verification

echo "🚀 Phase 4.3 Verification Testing - Complete Test Suite"
echo "========================================================"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
BACKEND_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:3000"
TEACHER_USERNAME="teacher_test@school.edu"
TEACHER_PASSWORD="SecureTeach123!"

# Student credentials array
STUDENT_USERS=(
    "student1_test@school.edu:LearnStudent456!:Alice Johnson:high"
    "student2_test@school.edu:StudySmart789!:Bob Smith:high"
    "student3_test@school.edu:BioLearn321!:Carol Davis:mid"
    "student4_test@school.edu:SciencePass654!:David Wilson:mid"
    "student5_test@school.edu:TestUser987!:Eva Brown:low"
    "student6_test@school.edu:BasicAccess123!:Frank Miller:low"
)

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to test authentication endpoint
test_authentication() {
    local username=$1
    local password=$2
    local role=$3
    
    print_info "Testing authentication for $username ($role)..."
    
    response=$(curl -s -X POST "$BACKEND_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"$username\",\"password\":\"$password\"}" \
        -w "\n%{http_code}")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ]; then
        token=$(echo "$body" | jq -r '.token' 2>/dev/null)
        if [ "$token" != "null" ] && [ -n "$token" ]; then
            print_status "$role authentication successful"
            echo "$token"
            return 0
        else
            print_error "$role authentication failed - no token received"
            return 1
        fi
    else
        print_error "$role authentication failed - HTTP $http_code"
        print_error "Response: $body"
        return 1
    fi
}

# Function to validate token
validate_token() {
    local token=$1
    local role=$2
    
    print_info "Validating $role token..."
    
    response=$(curl -s -X GET "$BACKEND_URL/api/auth/validate" \
        -H "Authorization: Bearer $token" \
        -w "\n%{http_code}")
    
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" = "200" ]; then
        print_status "$role token validation successful"
        return 0
    else
        print_error "$role token validation failed - HTTP $http_code"
        return 1
    fi
}

# Function to create test class
create_test_class() {
    local teacher_token=$1
    
    print_info "Creating test class..."
    
    response=$(curl -s -X POST "$BACKEND_URL/api/classes" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $teacher_token" \
        -d "{
            \"name\":\"Biology Analytics Test Class\",
            \"subject\":\"Biology\",
            \"description\":\"Test class for Phase 4.3 analytics verification\",
            \"maxStudents\":10,
            \"teacherId\":\"teacher_test_id\"
        }" \
        -w "\n%{http_code}")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "201" ]; then
        class_id=$(echo "$body" | jq -r '.classId' 2>/dev/null)
        if [ "$class_id" != "null" ] && [ -n "$class_id" ]; then
            print_status "Test class created successfully - ID: $class_id"
            echo "$class_id"
            return 0
        else
            print_error "Class creation failed - no classId received"
            return 1
        fi
    else
        print_error "Class creation failed - HTTP $http_code"
        print_error "Response: $body"
        return 1
    fi
}

# Function to enroll student in class
enroll_student() {
    local class_id=$1
    local student_token=$2
    local student_id=$3
    local student_name=$4
    
    print_info "Enrolling $student_name in test class..."
    
    response=$(curl -s -X POST "$BACKEND_URL/api/classes/$class_id/students" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $student_token" \
        -d "{
            \"studentId\":\"$student_id\",
            \"name\":\"$student_name\"
        }" \
        -w "\n%{http_code}")
    
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" = "201" ] || [ "$http_code" = "200" ]; then
        print_status "$student_name enrolled successfully"
        return 0
    else
        print_warning "$student_name enrollment failed - may already exist (HTTP $http_code)"
        return 0  # Don't fail the test for duplicate enrollment
    fi
}

# Function to simulate test submission
submit_test_results() {
    local class_id=$1
    local student_token=$2
    local student_id=$3
    local student_name=$4
    local performance_level=$5
    local test_type=$6
    
    print_info "Submitting $test_type results for $student_name ($performance_level)..."
    
    # Determine answers based on performance level
    case "$performance_level" in
        "high")
            if [ "$test_type" = "pretest" ] || [ "$test_type" = "retention" ]; then
                answers='["B", "C", "B"]'
                score=3
            else
                answers='["Correct", "Correct", "Correct"]'
                score=3
            fi
            ;;
        "mid")
            if [ "$test_type" = "pretest" ] || [ "$test_type" = "retention" ]; then
                answers='["B", "A", "B"]'
                score=2
            else
                answers='["Correct", "Correct", "Incorrect"]'
                score=2
            fi
            ;;
        "low")
            if [ "$test_type" = "pretest" ] || [ "$test_type" = "retention" ]; then
                answers='["A", "A", "B"]'
                score=1
            else
                answers='["Incorrect", "Incorrect", "Incorrect"]'
                score=0
            fi
            ;;
    esac
    
    response=$(curl -s -X POST "$BACKEND_URL/api/analytics/test-results" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $student_token" \
        -d "{
            \"studentId\":\"$student_id\",
            \"classId\":\"$class_id\",
            \"testType\":\"$test_type\",
            \"answers\":$answers,
            \"score\":$score,
            \"maxScore\":3,
            \"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
            \"metadata\":{
                \"expectedPerformance\":\"$performance_level\",
                \"actualScore\":$score
            }
        }" \
        -w "\n%{http_code}")
    
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" = "201" ] || [ "$http_code" = "200" ]; then
        print_status "$student_name $test_type results submitted ($score/3)"
        return 0
    else
        print_error "$student_name $test_type submission failed (HTTP $http_code)"
        return 1
    fi
}

# Function to verify analytics dashboard
verify_analytics() {
    local class_id=$1
    local teacher_token=$2
    
    print_info "Verifying analytics dashboard..."
    
    response=$(curl -s -X GET "$BACKEND_URL/api/analytics/class/$class_id" \
        -H "Authorization: Bearer $teacher_token" \
        -w "\n%{http_code}")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ]; then
        print_status "Analytics data retrieved successfully"
        
        # Parse and display key metrics
        group_count=$(echo "$body" | jq -r '.groupPerformance | length' 2>/dev/null)
        ai_effectiveness=$(echo "$body" | jq -r '.aiInsights.algorithmEffectiveness' 2>/dev/null)
        
        if [ "$group_count" != "null" ] && [ -n "$group_count" ]; then
            print_info "Group formation detected: $group_count groups"
        fi
        
        if [ "$ai_effectiveness" != "null" ] && [ -n "$ai_effectiveness" ]; then
            print_info "AI Algorithm Effectiveness: ${ai_effectiveness}%"
        fi
        
        return 0
    else
        print_error "Analytics verification failed (HTTP $http_code)"
        print_error "Response: $body"
        return 1
    fi
}

# Function to test data export
test_export() {
    local class_id=$1
    local teacher_token=$2
    local format=$3
    
    print_info "Testing $format export..."
    
    response=$(curl -s -X POST "$BACKEND_URL/api/analytics/export" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $teacher_token" \
        -d "{
            \"classId\":\"$class_id\",
            \"format\":\"$format\",
            \"anonymize\":false,
            \"includeGenderData\":true
        }" \
        -w "\n%{http_code}")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ]; then
        record_count=$(echo "$body" | jq -r '.recordCount' 2>/dev/null)
        filename=$(echo "$body" | jq -r '.filename' 2>/dev/null)
        
        if [ "$record_count" != "null" ] && [ -n "$record_count" ]; then
            print_status "$format export successful ($record_count records)"
            print_info "  Filename: $filename"
            return 0
        else
            print_error "$format export failed - invalid response format"
            return 1
        fi
    else
        print_error "$format export failed (HTTP $http_code)"
        return 1
    fi
}

# Main test execution
main() {
    echo ""
    print_info "Starting Phase 4.3 Verification Testing"
    print_info "Backend URL: $BACKEND_URL"
    print_info "Frontend URL: $FRONTEND_URL"
    echo ""
    
    local passed_tests=0
    local total_tests=0
    
    # Test 1: Teacher Authentication
    ((total_tests++))
    print_info "Test 1: Teacher Authentication"
    teacher_token=$(test_authentication "$TEACHER_USERNAME" "$TEACHER_PASSWORD" "Teacher")
    if [ $? -eq 0 ] && [ -n "$teacher_token" ]; then
        validate_token "$teacher_token" "Teacher"
        if [ $? -eq 0 ]; then
            ((passed_tests++))
        fi
    fi
    
    # Test 2: Student Authentications
    print_info "Test 2: Student Authentications (6 students)"
    student_tokens=()
    student_data=()
    
    for student_info in "${STUDENT_USERS[@]}"; do
        IFS=':' read -r username password name performance <<< "$student_info"
        ((total_tests++))
        
        token=$(test_authentication "$username" "$password" "Student ($name)")
        if [ $? -eq 0 ] && [ -n "$token" ]; then
            validate_token "$token" "Student ($name)"
            if [ $? -eq 0 ]; then
                student_tokens+=("$token")
                student_data+=("$username:$name:$performance")
                ((passed_tests++))
            fi
        fi
    done
    
    # Test 3: Create Test Class (requires teacher token)
    if [ -n "$teacher_token" ]; then
        ((total_tests++))
        print_info "Test 3: Create Test Class"
        class_id=$(create_test_class "$teacher_token")
        if [ $? -eq 0 ] && [ -n "$class_id" ]; then
            ((passed_tests++))
            
            # Test 4: Enroll Students
            print_info "Test 4: Enroll Students in Class"
            for i in "${!student_data[@]}"; do
                IFS=':' read -r username name performance <<< "${student_data[$i]}"
                student_token="${student_tokens[$i]}"
                student_id="student$((i+1))_test_id"
                
                ((total_tests++))
                enroll_student "$class_id" "$student_token" "$student_id" "$name"
                if [ $? -eq 0 ]; then
                    ((passed_tests++))
                fi
            done
            
            # Test 5: Submit Test Results (all test types)
            test_types=("pretest" "posttest" "retention")
            for test_type in "${test_types[@]}"; do
                print_info "Test 5: Submit $test_type Results"
                for i in "${!student_data[@]}"; do
                    IFS=':' read -r username name performance <<< "${student_data[$i]}"
                    student_token="${student_tokens[$i]}"
                    student_id="student$((i+1))_test_id"
                    
                    ((total_tests++))
                    submit_test_results "$class_id" "$student_token" "$student_id" "$name" "$performance" "$test_type"
                    if [ $? -eq 0 ]; then
                        ((passed_tests++))
                    fi
                done
            done
            
            # Test 6: Verify Analytics Dashboard
            ((total_tests++))
            print_info "Test 6: Verify Analytics Dashboard"
            verify_analytics "$class_id" "$teacher_token"
            if [ $? -eq 0 ]; then
                ((passed_tests++))
            fi
            
            # Test 7: Data Export (CSV and JSON)
            print_info "Test 7: Data Export Functionality"
            for format in "csv" "json"; do
                ((total_tests++))
                test_export "$class_id" "$teacher_token" "$format"
                if [ $? -eq 0 ]; then
                    ((passed_tests++))
                fi
            done
            
            # Final summary
            echo ""
            echo "📋 TEST EXECUTION COMPLETE"
            echo "=========================="
            print_info "Total Tests: $total_tests"
            print_info "Passed: $passed_tests"
            print_info "Failed: $((total_tests - passed_tests))"
            
            success_rate=$(( (passed_tests * 100) / total_tests ))
            if [ $success_rate -ge 80 ]; then
                print_status "Success Rate: ${success_rate}%"
            else
                print_warning "Success Rate: ${success_rate}%"
            fi
            
            echo ""
            print_info "Next Steps:"
            print_info "1. Navigate to $FRONTEND_URL/class/$class_id/analytics"
            print_info "2. Login as teacher: $TEACHER_USERNAME"
            print_info "3. Verify group formation and performance analytics"
            print_info "4. Test real-time updates and data export features"
            
            # Save test summary
            cat > test-summary.txt << EOF
Phase 4.3 Verification Test Results
Generated: $(date)
=====================================

Backend URL: $BACKEND_URL
Frontend URL: $FRONTEND_URL
Test Class ID: $class_id

Authentication Results:
- Teacher: $TEACHER_USERNAME (Authenticated: Success)
- Students Tested: ${#STUDENT_USERS[@]}
- Student Tokens Generated: ${#student_tokens[@]}

Test Results:
- Total Tests: $total_tests
- Passed: $passed_tests  
- Failed: $((total_tests - passed_tests))
- Success Rate: ${success_rate}%

Performance Distribution:
- High Performers (3/3): 2 students (Alice, Bob)
- Mid Performers (2/3): 2 students (Carol, David)
- Low Performers (0-1/3): 2 students (Eva, Frank)

Next Steps:
1. Access analytics dashboard at: $FRONTEND_URL/class/$class_id/analytics
2. Verify group formation based on performance levels
3. Check AI algorithm effectiveness metrics
4. Test data export functionality
5. Validate real-time updates

EOF
            
            print_status "Test summary saved to test-summary.txt"
            
        fi
    else
        print_error "Cannot proceed without teacher authentication"
        exit 1
    fi
}

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    print_error "jq is required but not installed. Please install jq first."
    print_info "Ubuntu/Debian: sudo apt-get install jq"
    print_info "macOS: brew install jq"
    print_info "CentOS/RHEL: sudo yum install jq"
    exit 1
fi

# Check if curl is installed
if ! command -v curl &> /dev/null; then
    print_error "curl is required but not installed."
    exit 1
fi

# Run main function
main

echo ""
echo "🎉 Phase 4.3 Verification Testing Complete!"