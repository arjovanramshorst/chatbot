# Task design
## Task Descriptions
There are three different types of task frameworks that can be chosen, namely:
- External data source (such as Twitter)
- Local data source (such as Dropbox)
- Content creation (User sends in image)

The chatbot in this case is only functional for the Delft community. The Municipality of Delft has several tasks they would like to have performed. That is how the following tasks were created for the three types of task frameworks.

## External data source (Twitter)
The external data source Twitter is used to gather tweets that carry the hashtag #Delft. The goal of gathering these tweets is so that the Municipality of Delft can showcase them on the timeline on its website. 

The worker will receive a tweet that was collected by the system and he/she will have to judge whether the tweet would be suitable for placement on the website.

As preprocessing the tweets will be filtered on swear words in the pipeline, so that the swear word containing tweets are not offered as content of tasks. 

As postprocessing aggregate solution values will be gathered and outputted as a CSV file by the pipeline process, together with some computed suggestions as to whether or not the tweet should eventually be shared by the municipality. 

## Local data source (Dropbox)
The local data source Dropbox is utilized for retrieving images from the Municipality of Delft to our system. The Municipality of Delft possesses a so-called ‘Beeldbank’ which is an online archive that contains images from the Heritage of Delft. These images are categorized by ‘Topografie’ (topographie), ‘Portretten’ (portraits) and ‘Historie’ (history). Now the Municipality of Delft has decided to digitalize additional images, which they would like to categorize by these same three categories.

The worker will be offered an image which he/she will have to categorize by choosing between the options ‘Topografie’, ‘Portretten’ and ‘Historie’. The resulting categories can be used to sort the images on the Beeldbank website. 

There is no real preprocessing necessary for this task as images are simply loaded from Dropbox. For postprocessing, we have implemented a output to csv script that summarizes the responses by different workers with the answers most often given and a certainty score associated with this answer.

## Content creation (Send in image)
The content creation task in this case constitutes the submission of images from tourist locations. The Municipality of Delft would like to analyze the crowds at certain tourist locations in order to get a better view of the crowdedness of these locations at certain hours of the day. The individual tasks will consist of the request for sending in photos of certain locations at many different and relatively specific hours of the day.

The worker will for example get the task to take a photo of the ‘New Church’ between 10.00 and 10.30 in the morning.

Pre- and postprocessing is not applicable in this scenario.
