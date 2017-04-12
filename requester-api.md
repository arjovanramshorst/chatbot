### Requester API description

###`POST \api\tasks`
Creates a new task, with the required data below.
###`PUT \api\tasks\{task_id}`
Updates task with {task_id}, requires the same data below
 
####Data required for creating/updating a task:
 
##### String: `id`
The id of the requester. 

##### String: `description` 
A string that is given to the user when he starts the task. This should explain the goal of the task. 

##### (optional) Number: `solution_limit`
 
Defaults to 5 

The max amount of solutions a single unit may get.

##### Object: `content_definition`
Content that is used in the task can be described here. 

    {
        content_type: enum('TEXT_LIST', 'IMAGE_LIST')
        content_fields: Object
    }
    
##### Array: `questions`
An array containing the questions (in the order they should be asked) as objects. 

    [{
        question: String,
        response_definition: {
            response_type: enum('NUMBER', 'FREE_TEXT', 'SELECT', 'IMAGE'),
            response_select_options: [String], (Optional, only if response_type == SELECT)
    }]
    
`response_type` can be one of the following:

* `NUMBER`: The user can only answer with a number.
* `FREE_TEXT`: The user can answer any kind of text.
* `SELECT`: The user can choose from a number of predefined answers. If this one is selected, response_select_options must be added as well.
* `IMAGE`: The user is expected to answer with a picture of something.
 
##### (optional) Boolean: `requires_review`

default: true

When this is true, users can review the answers of other users to assure that the quality of submissions is high.

###`GET /api/tasks`
Returns all tasks currently in the platform

###`GET /api/tasks/{task_id}`
Returns the task with ID and all its corresponding units.

###`DELETE /api/tasks/{task_id}`
Deletes the task with ID.

###`GET /api/tasks/{task_id}/units`
Returns all units for a certain task, including the solutions.

###`POST /api/tasks/{task_id}/units`
Creates a new unit for task with ID. 

####Data required for unit creation task:
 
#####Object: `content`
The content for a unit, can be either text, a tweet or an image for now. 