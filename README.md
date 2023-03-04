# GitHub to OpenAI

This is a Tampermonkey userscript that adds a button that will copy the content of a GitHub issue/discussion/PR and ask to OpenAI **ChatGPT** API what should be answered.

I found that the answers are most of the time quite relevant, just need some manual adjustments to make it fully human-like 💥

## How does it work?

1. Extract the whole conversation, including the pseudos
2. Indicate which pseudo is mine
3. Give clear instructions to make the output more relevant to GitHub context
4. Clearly separate each message so the AI understands the context properly
5. Ask to complete my next answer

## Prompt

The prompt is currently the following:

![Prompt screenshot, see below](./playground.webp)

As an example, this is what the prompt would look like for [this pull request](https://github.com/aws/aws-cdk/pull/23095):

```
"This is a conversation on GitHub. Your username is "rigwild".
You are an experienced GitHub user that is answering to a discussion, an issue, or a pull request - and try your best to give helpful and appropriate responses.
Please answer it by trying your best to be helpful.

Additional instructions:
- You are user "@rigwild", you must answer to others, not yourself!
- Your responses must be positive
- If you need to criticize or suggest something, you try to list multiple arguments in a coherent fashion, to be as constructive as possible
- Try to not write too big paragraphs of text, instead you must add spacings or go to line or break line often to make your response easier to read
- Take the global context but remember that you should probably give an answer related to the latest messages in the whole conversation
- Your response must not contain anything other than the content of the answer itself

Here is the conversation content that you must answer to:

###############

@rigwild on [Nov 26, 2022, 3:11 AM GMT+1]: """
Description

Previous PR added support for missing statistics #23074
This PR implements a proper parsing of all these statistics.

Support "short" format ts99
Support "long" format
TS(10%:90%) | TS(10:90)
TS(:90) | TS(:90%)
TS(10:) | TS(10%:)
Formats are case insensitive (no breaking changes)
If "long" format and only upper boundary% TS(:90%), can be translated to "short" format ts90 (stat.asSingleStatStr)
Note

I noticed that the following code expected the parsing to throw if it failed, but it actually will not fail in any case (it just return GenericStatistic if no format matched).
I will not change this behavior here as I'm not willing to spend more effort testing if this breaks stuff elsewhere.

aws-cdk/packages/@aws-cdk/aws-cloudwatch/lib/metric.ts

Lines 295 to 296 in 47943d2

	 // Try parsing, this will throw if it's not a valid stat
	 this.statistic = normalizeStatistic(props.statistic || 'Average');

Followup work

As is, this PR does not change any customer-facing logic. To make use of it, make the parsing throw if no format is recognized.

At the end of the parser function, just replace

return {
  type: 'generic',
  statistic: stat,
} as GenericStatistic;

with

throw new UnrecognizedStatisticFormatError()

You can see all tested inputs here: regexr.com/7351s

All Submissions:
 Have you followed the guidelines in our Contributing guide?
Adding new Unconventional Dependencies:
 This PR adds new unconventional dependencies following the process described here
New Features
 Have you added the new feature to an integration test?
 Did you use yarn integ to deploy the infrastructure and generate the snapshot (i.e. yarn integ without --dry-run)?

By submitting this pull request, I confirm that my contribution is made under the terms of the Apache-2.0 license
"""

==========

@gitpod-io on [Nov 26, 2022, 3:11 AM GMT+1]: """

"""

==========

@AWS CDK Automation on []: """
The pull request linter has failed. See the aws-cdk-automation comment below for failure reasons. If you believe this pull request should receive an exemption, please comment and provide a justification.
"""

==========

@ on []: """
✅ Updated pull request passes all PRLinter validations. Dissmissing previous PRLinter review.
"""

==========

@rigwild on [Nov 28, 2022, 6:57 PM GMT+1]: """
This is ready for review
"""

==========

@rix0rrr on [Nov 30, 2022, 12:37 PM GMT+1]: """
Hi @rigwild!

Heads up, that enum you modified in your previous PR was exposed by accident, and was never supposed to be public! 🫣

I've moved your new enum values to a class with factory functions in this PR here: #23172

Thanks for updating the parsing logic as well, but I'm unclear on whether this changes any output. Is it just for completeness of the internal typing?
"""

==========

[...]
```

![ask_openai](https://user-images.githubusercontent.com/26366184/205464611-eaf040a9-68e7-47de-b514-7b2c8bbc01d6.gif)

Most common issue I faced with this experiment: the maximum length of a prompt is 4097 tokens. On large issues/PRs, the amount of text can easily be way above that.
For now, it's good for not so difficult/long conversations.

## More complex example

I tried this with a browser feature proposal related to privacy - a quite complex/niche topic: [Privacy by design with browser-managed E2E encryption and Fenced Frames](https://github.com/privacycg/proposals/issues/31).

For this, I modified the prompt a bit:

```
"Your task: give a constructive and argumented critic on this proposal."
```

And the suggested response:

```
This proposal for adding privacy features to web browsers is an interesting idea and could be a great way to improve user privacy and security. However, there are a few areas of concern that must be addressed in order for this to be successful.

First, there needs to be a clear way for web apps to opt-in to this feature. That way, web apps that are not compatible with the proposed architecture won't be forced to use it, and users will still be able to use those services. Additionally, the opt-in process needs to be user-friendly and secure, so that users understand the implications and can make an informed decision.

Second, there needs to be an easy way for users to access their data across different browsers, devices, and platforms. For instance, users should be able to access their data on their laptop, phone, and tablet, and they should also be able to access their data from different browsers (e.g. Chrome, Firefox, Safari). This is important because it allows users to have more control over their data and to be able to easily migrate to different browsers and devices.

Third, there needs to be a way for users to back up their data and to restore it in case of data loss. This is important because users should not be at risk of permanently losing their data due to a browser issue or a device issue.
Finally, there needs to be a way for developers to build apps that use the proposed architecture without introducing any security or privacy issues. For example, developers should be able to use the proposed architecture to build authentication and password managers without introducing any security or privacy issues. Additionally, developers should be able to build apps that use the proposed architecture without introducing any performance issues.

Overall, this is an interesting proposal that could have a positive impact on user privacy and security. However, it is important that all of the areas of concern mentioned above are addressed before this feature can be implemented.
```

The results are very impressive. It understood the context and the requested proposal quite well! 🤯

## Usage

- Generate a new [OpenAI API key](https://beta.openai.com/account/api-keys)
- Go to any issue/PR/discussion, you can try with [#1](https://github.com/rigwild/github-to-openai/issues/1)
- Click on "👉 Ask OpenAI what to answer" at the bottom-right corner
- Enter your API key in the prompt window `sk-...`
- Wait a bit
- Answer should be copied to your clipboard! Paste it and post your answer! ✌️

To remove your API key, shift + click on the link.

## License

[The MIT License](./LICENSE)
